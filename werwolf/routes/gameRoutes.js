const express = require('express');
const Game = require('../models/Game');

const router = express.Router();

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function setPhaseEnd(game, seconds) {
  game.phase_ends_at = new Date(Date.now() + seconds * 1000);
}

function getNightTimerSeconds(game) {
  const configured = Number(game?.settings?.night_timer);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  const legacy = Number(game?.wolf_timer);
  if (Number.isFinite(legacy) && legacy > 0) {
    return legacy;
  }

  return 30;
}

function getDayTimerSeconds(game) {
  const configured = Number(game?.settings?.day_timer);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  const legacy = Number(game?.discussion_timer);
  if (Number.isFinite(legacy) && legacy > 0) {
    return legacy;
  }

  return 60;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
  }
  return fallback;
}

function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[randomIndex]] = [values[randomIndex], values[index]];
  }
  return values;
}

function findPlayer(game, playerId) {
  return (game.players || []).find((player) => Number(player.player_id) === Number(playerId));
}

function getAlivePlayers(game) {
  return (game.players || []).filter((player) => Number(player.is_alive) === 1);
}

function getAliveByRole(game, role) {
  return getAlivePlayers(game).filter((player) => player.role === role);
}

function applyLinkedDeath(game, playerId) {
  const killedIds = new Set();
  const queue = [Number(playerId)];

  while (queue.length > 0) {
    const currentId = Number(queue.shift());
    if (!Number.isFinite(currentId) || killedIds.has(currentId)) {
      continue;
    }

    const target = findPlayer(game, currentId);
    if (!target || Number(target.is_alive) === 0) {
      continue;
    }

    target.is_alive = 0;
    killedIds.add(currentId);

    if (target.linked_user_id !== null && target.linked_user_id !== undefined) {
      queue.push(Number(target.linked_user_id));
    }
  }

  return Array.from(killedIds);
}

function getDeadHunterId(game, killedIds) {
  for (const killedId of killedIds) {
    const player = findPlayer(game, killedId);
    if (player && player.role === 'hunter') {
      return Number(player.player_id);
    }
  }

  return null;
}

function startHunterRevenge(game, hunterId, returnPhase, returnStep = null) {
  game.game_phase = 'hunter_revenge';
  game.night_step = null;
  game.hunter_revenge_player_id = Number(hunterId);
  game.hunter_revenge_return_phase = returnPhase;
  game.hunter_revenge_return_step = returnStep;
  setPhaseEnd(game, getNightTimerSeconds(game));
}

function clearHunterRevengeState(game) {
  game.hunter_revenge_player_id = null;
  game.hunter_revenge_return_phase = null;
  game.hunter_revenge_return_step = null;
}

function resumeFromHunterRevenge(game) {
  const returnPhase = game.hunter_revenge_return_phase;
  const returnStep = game.hunter_revenge_return_step;

  clearHunterRevengeState(game);

  if (returnPhase === 'day') {
    game.game_phase = 'day';
    game.night_step = returnStep || null;
    setPhaseEnd(game, getDayTimerSeconds(game));
    return;
  }

  game.game_phase = 'night';
  game.night_step = returnStep || 'seer';
  setPhaseEnd(game, getNightTimerSeconds(game));
}

function checkGameOver(game) {
  const alive = getAlivePlayers(game);
  const wolves = alive.filter((player) => player.role === 'wolf').length;
  const others = alive.filter((player) => player.role !== 'wolf').length;

  if (wolves === 0) {
    game.game_phase = 'gameover';
    game.winner = 'village';
    return 'village';
  }

  if (wolves >= others) {
    game.game_phase = 'gameover';
    game.winner = 'wolves';
    return 'wolves';
  }

  return null;
}

function buildPublicPlayers(game, me) {
  const revealRoles = Boolean((me && Number(me.is_alive) === 0) || game.game_phase === 'gameover');

  return (game.players || []).map((player) => {
    const base = {
      id: player.player_id,
      player_id: player.player_id,
      name: player.name,
      is_alive: player.is_alive,
      is_ready: player.is_ready,
      target_id: player.target_id,
      linked_user_id: player.linked_user_id,
      seer_used: player.seer_used,
      armor_used: player.armor_used,
      potions_left: player.potions_left,
      last_seen: player.last_seen
    };

    if (revealRoles) {
      base.role = player.role;
    }

    return base;
  });
}

function toGameStateResponse(gameDoc, myId = null) {
  const game = gameDoc.toObject ? gameDoc.toObject() : gameDoc;
  const me = myId !== null && myId !== undefined && myId !== ''
    ? (game.players || []).find((player) => Number(player.player_id) === Number(myId)) || null
    : null;

  const players = buildPublicPlayers(game, me);

  return {
    game: {
      _id: game._id,
      room_code: game.room_code,
      game_phase: game.game_phase,
      night_step: game.night_step,
      phase_ends_at: game.phase_ends_at,
      winner: game.winner,
      max_players: game.max_players,
      wolf_timer: game.wolf_timer,
      discussion_timer: game.discussion_timer,
      settings: game.settings,
      wolf_count: game.wolf_count,
      last_night_victim: game.last_night_victim,
      last_night_event: game.last_night_event,
      first_day_passed: game.first_day_passed,
      hunter_revenge_player_id: game.hunter_revenge_player_id,
      hunter_revenge_return_phase: game.hunter_revenge_return_phase,
      hunter_revenge_return_step: game.hunter_revenge_return_step,
      created_at: game.created_at
    },
    players,
    me: me
      ? {
          id: me.player_id,
          player_id: me.player_id,
          role: me.role,
          potions_left: me.potions_left,
          linked_user_id: me.linked_user_id,
          seer_used: me.seer_used,
          armor_used: me.armor_used,
          is_alive: me.is_alive,
          name: me.name,
          target_id: me.target_id,
          is_ready: me.is_ready
        }
      : null,
    phase_ends_at_unix: game.phase_ends_at ? Math.floor(new Date(game.phase_ends_at).getTime() / 1000) : null,
    server_time: nowUnix(),
    winner: game.winner || null,
    last_night_event: game.last_night_event || null,
    last_night_victim: game.last_night_victim || null
  };
}

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

async function createUniqueRoomCode() {
  let code = generateRoomCode();
  let existing = await Game.findOne({ room_code: code }).select('_id').lean();

  while (existing) {
    code = generateRoomCode();
    existing = await Game.findOne({ room_code: code }).select('_id').lean();
  }

  return code;
}

async function handleStartGame(game, payload) {
  const wolfCount = Number(payload.wolfCount || payload.wolf_count || game.wolf_count || 1);
  const withHunter = parseBoolean(
    payload.withHunter ?? payload.with_hunter ?? game.settings?.with_hunter,
    true
  );
  const alivePlayers = getAlivePlayers(game);

  if (alivePlayers.length < 5) {
    return { error: 'not_enough_players', required: 5, current: alivePlayers.length };
  }

  const playersShuffled = shuffle([...(game.players || [])]);
  const roles = [];

  for (let index = 0; index < wolfCount; index += 1) roles.push('wolf');
  roles.push('seer', 'witch', 'armor');
  if (withHunter) {
    roles.push('hunter');
  }
  while (roles.length < playersShuffled.length) roles.push('villager');

  shuffle(roles);

  for (let index = 0; index < playersShuffled.length; index += 1) {
    playersShuffled[index].role = roles[index] || 'villager';
    playersShuffled[index].is_alive = 1;
    playersShuffled[index].seer_used = 0;
    playersShuffled[index].armor_used = 0;
    playersShuffled[index].target_id = null;
    playersShuffled[index].linked_user_id = null;
    if (playersShuffled[index].role === 'witch') {
      playersShuffled[index].potions_left = '11';
    }
  }

  game.players = playersShuffled;
  game.wolf_count = wolfCount;
  game.game_phase = 'night';
  game.night_step = 'armor';
  game.last_night_event = null;
  game.last_night_victim = null;
  game.winner = null;
  game.settings = {
    ...(game.settings || {}),
    with_hunter: withHunter
  };
  clearHunterRevengeState(game);
  setPhaseEnd(game, getNightTimerSeconds(game));

  await game.save();
  return { status: 'started' };
}

async function handleWolfVote(game, payload) {
  const voterId = Number(payload.voterId);
  const targetId = Number(payload.targetId);

  const voter = findPlayer(game, voterId);
  if (!voter || voter.role !== 'wolf' || Number(voter.is_alive) === 0) {
    return { error: 'invalid voter' };
  }

  const target = findPlayer(game, targetId);
  if (!target || Number(target.is_alive) === 0) {
    return { error: 'invalid target' };
  }

  if (target.role === 'wolf') {
    return { error: 'wolves_may_not_target_wolf' };
  }

  voter.target_id = targetId;
  await game.save();
  return { status: 'ok' };
}

async function handleGetWolfVotes(game) {
  const wolves = getAliveByRole(game, 'wolf').map((wolf) => ({
    id: wolf.player_id,
    name: wolf.name,
    role: wolf.role,
    target_id: wolf.target_id
  }));

  return { wolves };
}

async function handleArmorLink(game, payload) {
  const armorId = Number(payload.armorId);
  const a = Number(payload.playerA);
  const b = Number(payload.playerB);

  const armor = findPlayer(game, armorId);
  if (!armor || armor.role !== 'armor' || Number(armor.is_alive) === 0) {
    return { error: 'invalid armor' };
  }

  if (Number(armor.armor_used) === 1) {
    return { error: 'armor_already_used' };
  }

  if (a === b) {
    return { error: 'must_choose_two_distinct' };
  }

  const playerA = findPlayer(game, a);
  const playerB = findPlayer(game, b);
  if (!playerA || !playerB || Number(playerA.is_alive) === 0 || Number(playerB.is_alive) === 0) {
    return { error: 'invalid_targets' };
  }

  playerA.linked_user_id = b;
  playerB.linked_user_id = a;
  armor.armor_used = 1;

  await game.save();
  return { status: 'ok', linked: [a, b] };
}

async function handlePerformAction(game, payload) {
  const playerId = payload.playerId !== undefined ? Number(payload.playerId) : Number(payload.myId);
  const target = payload.targetId !== undefined && payload.targetId !== null && payload.targetId !== ''
    ? Number(payload.targetId)
    : null;

  const actor = findPlayer(game, playerId);
  if (!actor) {
    return { error: 'invalid_player' };
  }

  const isHunterShot = actor.role === 'hunter' && String(payload.hunter_shot) === '1';

  if (game.game_phase === 'hunter_revenge') {
    if (!isHunterShot) {
      return { error: 'hunter_shot_required' };
    }

    if (Number(game.hunter_revenge_player_id) !== Number(playerId)) {
      return { error: 'not_active_hunter' };
    }

    if (target === null) {
      return { error: 'missing_target' };
    }

    const shotTarget = findPlayer(game, target);
    if (!shotTarget || Number(shotTarget.is_alive) === 0 || Number(shotTarget.player_id) === Number(playerId)) {
      return { error: 'invalid_target' };
    }

    const killedByShot = applyLinkedDeath(game, target);
    game.last_night_event = `hunter_shot:${target}`;

    const winner = checkGameOver(game);
    if (!winner) {
      resumeFromHunterRevenge(game);
    } else {
      clearHunterRevengeState(game);
    }

    await game.save();
    return { status: 'ok', hunter_shot: target, killed: killedByShot, winner: game.winner || null };
  }

  if (Number(actor.is_alive) === 0 && !isHunterShot) {
    return { error: 'dead_cannot_act' };
  }

  if (isHunterShot) {
    return { error: 'invalid_phase_for_hunter_shot' };
  }

  actor.target_id = target;
  await game.save();
  return { status: 'ok', target };
}

async function handleClearVote(game, payload) {
  const playerId = payload.playerId !== undefined ? Number(payload.playerId) : Number(payload.myId);
  const actor = findPlayer(game, playerId);

  if (!actor) {
    return { error: 'invalid_player' };
  }

  actor.target_id = null;
  await game.save();
  return { status: 'ok' };
}

async function handleSeerPeek(game, payload) {
  const seerId = Number(payload.seerId);
  const targetId = Number(payload.targetId);

  const seer = findPlayer(game, seerId);
  if (!seer || seer.role !== 'seer' || Number(seer.is_alive) === 0) {
    return { error: 'invalid seer' };
  }

  if (Number(seer.seer_used) === 1) {
    return { error: 'already_used' };
  }

  const target = findPlayer(game, targetId);
  if (!target) {
    return { error: 'invalid target' };
  }

  seer.seer_used = 1;
  await game.save();

  return { role: target.role };
}

async function handleUseWitch(game, payload) {
  const witchId = Number(payload.witchId);
  const heal = payload.heal === true || payload.heal === 'true' || payload.heal === '1';
  const poison = payload.poison !== undefined && payload.poison !== null && payload.poison !== '' && payload.poison !== 'null'
    ? Number(payload.poison)
    : null;

  const witch = findPlayer(game, witchId);
  if (!witch || witch.role !== 'witch' || Number(witch.is_alive) === 0) {
    return { error: 'invalid witch' };
  }

  let potions = witch.potions_left || '11';
  const events = [];

  if (heal && potions[0] !== '1') {
    return { error: 'no_heal' };
  }

  if (poison !== null && potions[1] !== '1') {
    return { error: 'no_poison' };
  }

  if (heal) {
    if (!game.last_night_victim) {
      return { error: 'no_victim_to_heal' };
    }

    events.push(`saved:${game.last_night_victim}`);
    game.last_night_victim = null;
    potions = `0${potions[1]}`;
  }

  if (poison !== null) {
    const poisonTarget = findPlayer(game, poison);
    if (!poisonTarget || Number(poisonTarget.is_alive) === 0) {
      return { error: 'invalid target' };
    }

    applyLinkedDeath(game, poison);
    events.push(`poisoned:${poison}`);
    potions = `${potions[0]}0`;
    checkGameOver(game);
  }

  witch.potions_left = potions;
  if (events.length > 0) {
    game.last_night_event = events.join(',');
  }

  await game.save();
  return { status: 'ok', potions_left: potions };
}

async function handleNextPhase(game) {
  if (game.phase_ends_at) {
    const secondsLeft = Math.ceil((new Date(game.phase_ends_at).getTime() - Date.now()) / 1000);
    if (secondsLeft > 0) {
      return { error: 'timer_not_expired', secs_left: secondsLeft };
    }
  }

  const phaseOrder = ['armor', 'seer', 'wolf', 'witch'];

  if (game.game_phase === 'lobby') {
    game.game_phase = 'night';
    game.night_step = 'armor';
    setPhaseEnd(game, getNightTimerSeconds(game));
    await game.save();
    return { phase: 'night', step: 'armor' };
  }

  if (game.game_phase === 'hunter_revenge') {
    game.last_night_event = 'hunter_missed';
    resumeFromHunterRevenge(game);
    checkGameOver(game);
    await game.save();
    return { phase: game.game_phase, step: game.night_step, last_event: game.last_night_event };
  }

  if (game.game_phase === 'night') {
    const currentStep = game.night_step;
    const currentIndex = phaseOrder.indexOf(currentStep);

    if (currentStep === 'wolf') {
      const wolves = getAliveByRole(game, 'wolf');
      const votes = {};

      for (const wolf of wolves) {
        if (wolf.target_id !== null && wolf.target_id !== undefined) {
          const key = String(wolf.target_id);
          votes[key] = (votes[key] || 0) + 1;
        }
      }

      const voteEntries = Object.entries(votes).sort((left, right) => right[1] - left[1]);
      let killed = null;
      if (voteEntries.length > 0) {
        const maxVotes = voteEntries[0][1];
        const top = voteEntries.filter((entry) => entry[1] === maxVotes).map((entry) => Number(entry[0]));
        killed = top[Math.floor(Math.random() * top.length)];
      }

      if (killed !== null) {
        game.last_night_victim = killed;
        game.last_night_event = `pending_kill:${killed}`;
      } else {
        game.last_night_victim = null;
        game.last_night_event = null;
      }

      if (getAliveByRole(game, 'witch').length > 0) {
        game.night_step = 'witch';
        setPhaseEnd(game, getNightTimerSeconds(game));
        await game.save();
        return { phase: 'night', step: 'witch' };
      }
    }

    let nextStep = null;
    for (let index = currentIndex + 1; index < phaseOrder.length; index += 1) {
      const role = phaseOrder[index];
      if (getAliveByRole(game, role).length > 0) {
        nextStep = role;
        break;
      }
    }

    if (nextStep) {
      game.night_step = nextStep;
      setPhaseEnd(game, getNightTimerSeconds(game));
      await game.save();
      return { phase: 'night', step: nextStep };
    }

    let killedAtNightEnd = [];
    if (game.last_night_victim !== null && game.last_night_victim !== undefined) {
      killedAtNightEnd = applyLinkedDeath(game, game.last_night_victim);
      game.last_night_event = `killed:${game.last_night_victim}`;
    }

    const hunterKilledAtNight = getDeadHunterId(game, killedAtNightEnd);
    if (hunterKilledAtNight !== null) {
      game.last_night_victim = null;
      for (const player of game.players || []) {
        player.target_id = null;
      }
      startHunterRevenge(game, hunterKilledAtNight, 'day', null);
      await game.save();
      return { phase: 'hunter_revenge', hunter_id: hunterKilledAtNight };
    }

    game.game_phase = 'day';
    game.night_step = null;
    game.last_night_victim = null;
    setPhaseEnd(game, getDayTimerSeconds(game));
    for (const player of game.players || []) {
      player.target_id = null;
    }

    checkGameOver(game);
    await game.save();
    return { phase: game.game_phase, step: 'announce', last_event: game.last_night_event, winner: game.winner };
  }

  if (game.game_phase === 'day') {
    if (game.night_step !== 'voting') {
      game.night_step = 'voting';
      setPhaseEnd(game, getDayTimerSeconds(game));
      await game.save();
      return { phase: 'day', step: 'voting' };
    }

    const alive = getAlivePlayers(game);
    const votes = {};

    for (const player of alive) {
      if (player.target_id !== null && player.target_id !== undefined) {
        const key = String(player.target_id);
        votes[key] = (votes[key] || 0) + 1;
      }
    }

    const voteEntries = Object.entries(votes).sort((left, right) => right[1] - left[1]);
    let eliminated = null;

    if (voteEntries.length > 0) {
      const maxVotes = voteEntries[0][1];
      const top = voteEntries.filter((entry) => entry[1] === maxVotes).map((entry) => Number(entry[0]));
      eliminated = top[Math.floor(Math.random() * top.length)];
    }

    let killedByVote = [];
    if (eliminated !== null) {
      killedByVote = applyLinkedDeath(game, eliminated);
      game.last_night_event = `voted:${eliminated}`;
    } else {
      game.last_night_event = 'voted:none';
    }

    for (const player of game.players || []) {
      player.target_id = null;
    }

    let startingNightPhase = null;
    for (const phase of phaseOrder) {
      if (getAliveByRole(game, phase).length > 0) {
        startingNightPhase = phase;
        break;
      }
    }

    const hunterKilledByVote = getDeadHunterId(game, killedByVote);
    if (hunterKilledByVote !== null) {
      game.first_day_passed = 1;
      for (const player of game.players || []) {
        player.seer_used = 0;
        player.target_id = null;
      }
      startHunterRevenge(game, hunterKilledByVote, 'night', startingNightPhase || 'seer');
      await game.save();
      return { phase: 'hunter_revenge', hunter_id: hunterKilledByVote, eliminated };
    }

    const winner = checkGameOver(game);
    if (winner) {
      await game.save();
      return { phase: 'gameover', winner, eliminated };
    }

    game.game_phase = 'night';
    game.night_step = startingNightPhase || 'seer';
    game.first_day_passed = 1;

    for (const player of game.players || []) {
      player.seer_used = 0;
      player.target_id = null;
    }

    setPhaseEnd(game, getNightTimerSeconds(game));
    await game.save();
    return { phase: 'night', step: game.night_step, eliminated };
  }

  await game.save();
  return { status: 'ok' };
}

router.post('/', async (req, res) => {
  try {
    const nightTimer = Number(req.body.nightTimer ?? req.body.night_timer ?? req.body.wolfTimer ?? req.body.wolf_timer ?? 30);
    const dayTimer = Number(req.body.dayTimer ?? req.body.day_timer ?? req.body.discussTimer ?? req.body.discussion_timer ?? 60);
    const sanitizedNightTimer = Number.isFinite(nightTimer) && nightTimer > 0 ? nightTimer : 30;
    const sanitizedDayTimer = Number.isFinite(dayTimer) && dayTimer > 0 ? dayTimer : 60;
    const wolfCount = Number(req.body.wolfCount ?? req.body.wolf_count ?? 1);
    const maxPlayers = Number(req.body.maxPlayers ?? req.body.max_players ?? 8);
    const withHunter = parseBoolean(req.body.withHunter ?? req.body.with_hunter, true);

    const roomCode = await createUniqueRoomCode();

    const game = await Game.create({
      room_code: roomCode,
      game_phase: 'lobby',
      night_step: null,
      phase_ends_at: null,
      max_players: maxPlayers,
      wolf_timer: sanitizedNightTimer,
      discussion_timer: sanitizedDayTimer,
      settings: {
        day_timer: sanitizedDayTimer,
        night_timer: sanitizedNightTimer,
        with_hunter: withHunter
      },
      wolf_count: wolfCount,
      hunter_revenge_player_id: null,
      hunter_revenge_return_phase: null,
      hunter_revenge_return_step: null,
      players: [],
      next_player_id: 1
    });

    return res.status(201).json({
      code: game.room_code,
      room_code: game.room_code,
      max_players: game.max_players,
      wolf_timer: game.wolf_timer,
      discussion_timer: game.discussion_timer,
      settings: game.settings,
      game
    });
  } catch (error) {
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
});

router.post('/:room_code/players', async (req, res) => {
  try {
    const roomCode = String(req.params.room_code || '').toUpperCase();
    const name = String(req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'missing_name' });
    }

    const game = await Game.findOne({ room_code: roomCode });
    if (!game) {
      return res.status(404).json({ error: 'Raum nicht gefunden' });
    }

    if (game.game_phase !== 'lobby') {
      return res.status(409).json({ error: 'Spiel läuft bereits!' });
    }

    const takenName = (game.players || []).some((player) => player.name === name);
    if (takenName) {
      return res.status(409).json({ taken_name: true, error: 'Name bereits verwendet' });
    }

    const currentCount = (game.players || []).length;
    if (currentCount >= (game.max_players || 8)) {
      return res.status(409).json({ error: 'Raum ist voll' });
    }

    const playerId = Number(game.next_player_id || currentCount + 1);

    game.players.push({
      player_id: playerId,
      name,
      role: 'unknown',
      is_alive: 1,
      is_ready: 0,
      seer_used: 0,
      armor_used: 0,
      target_id: null,
      linked_user_id: null,
      potions_left: '11',
      last_seen: new Date()
    });

    game.next_player_id = playerId + 1;
    await game.save();

    return res.status(201).json({
      id: playerId,
      player_id: playerId,
      code: roomCode,
      room_code: roomCode,
      players: game.players.length,
      max_players: game.max_players || 8
    });
  } catch (error) {
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
});

router.get('/:room_code', async (req, res) => {
  try {
    const roomCode = String(req.params.room_code || '').toUpperCase();
    const myId = req.query.myId;
    const game = await Game.findOne({ room_code: roomCode });

    if (!game) {
      return res.status(404).json({ error: 'Raum nicht gefunden' });
    }

    return res.json(toGameStateResponse(game, myId));
  } catch (error) {
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
});

router.post('/:room_code/actions', async (req, res) => {
  try {
    const roomCode = String(req.params.room_code || '').toUpperCase();
    const game = await Game.findOne({ room_code: roomCode });

    if (!game) {
      return res.status(404).json({ error: 'Raum nicht gefunden' });
    }

    const action = String(req.body.action || '').trim();

    if (action === 'start_game') {
      return res.json(await handleStartGame(game, req.body));
    }

    if (action === 'next_phase') {
      return res.json(await handleNextPhase(game));
    }

    if (action === 'wolf_vote') {
      return res.json(await handleWolfVote(game, req.body));
    }

    if (action === 'get_wolf_votes') {
      return res.json(await handleGetWolfVotes(game));
    }

    if (action === 'armor_link') {
      return res.json(await handleArmorLink(game, req.body));
    }

    if (action === 'perform_action') {
      return res.json(await handlePerformAction(game, req.body));
    }

    if (action === 'clear_vote') {
      return res.json(await handleClearVote(game, req.body));
    }

    if (action === 'seer_peek') {
      return res.json(await handleSeerPeek(game, req.body));
    }

    if (action === 'use_witch') {
      return res.json(await handleUseWitch(game, req.body));
    }

    return res.status(400).json({ error: 'unknown_action' });
  } catch (error) {
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
});

router.patch('/:room_code', async (req, res) => {
  try {
    const roomCode = String(req.params.room_code || '').toUpperCase();

    const allowedGameFields = [
      'game_phase',
      'night_step',
      'phase_ends_at',
      'winner',
      'max_players',
      'wolf_timer',
      'discussion_timer',
      'wolf_count',
      'last_night_victim',
      'last_night_event',
      'first_day_passed',
      'hunter_revenge_player_id',
      'hunter_revenge_return_phase',
      'hunter_revenge_return_step'
    ];

    const setPayload = {};
    for (const field of allowedGameFields) {
      if (req.body[field] !== undefined) {
        setPayload[field] = req.body[field];
      }
    }

    if (req.body.settings && typeof req.body.settings === 'object') {
      const settingsDayTimer = Number(req.body.settings.day_timer ?? req.body.settings.dayTimer ?? 60);
      const settingsNightTimer = Number(req.body.settings.night_timer ?? req.body.settings.nightTimer ?? 30);
      const withHunterValue = req.body.settings.with_hunter ?? req.body.settings.withHunter;

      setPayload['settings.day_timer'] = settingsDayTimer;
      setPayload['settings.night_timer'] = settingsNightTimer;
      if (withHunterValue !== undefined) {
        setPayload['settings.with_hunter'] = parseBoolean(withHunterValue, true);
      }
      setPayload.discussion_timer = settingsDayTimer;
      setPayload.wolf_timer = settingsNightTimer;
    }

    let game = null;

    if (Object.keys(setPayload).length > 0) {
      game = await Game.findOneAndUpdate(
        { room_code: roomCode },
        { $set: setPayload },
        { new: true }
      );
    } else {
      game = await Game.findOne({ room_code: roomCode });
    }

    if (!game) {
      return res.status(404).json({ error: 'Raum nicht gefunden' });
    }

    const playerUpdate = req.body.player_update;
    if (playerUpdate && playerUpdate.player_id && playerUpdate.set && typeof playerUpdate.set === 'object') {
      const player = findPlayer(game, Number(playerUpdate.player_id));
      if (player) {
        const allowedPlayerFields = [
          'role',
          'is_alive',
          'is_ready',
          'seer_used',
          'armor_used',
          'target_id',
          'linked_user_id',
          'potions_left',
          'last_seen'
        ];

        for (const [key, value] of Object.entries(playerUpdate.set)) {
          if (allowedPlayerFields.includes(key)) {
            player[key] = value;
          }
        }

        await game.save();
      }
    }

    return res.json({ status: 'ok', ...toGameStateResponse(game) });
  } catch (error) {
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
});

router.delete('/:room_code', async (req, res) => {
  try {
    const roomCode = String(req.params.room_code || '').toUpperCase();
    const deleted = await Game.deleteOne({ room_code: roomCode });

    if (!deleted.deletedCount) {
      return res.status(404).json({ error: 'Raum nicht gefunden' });
    }

    return res.json({ status: 'deleted', room_code: roomCode });
  } catch (error) {
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
});

module.exports = router;
