// Globale Variablen
let gameCode = null;
let myPlayerId = null;
let myUsername = sessionStorage.getItem('ww_username') || null;
let isHost = false;
let pollingInterval = null;
let currentPhase = 'lobby';
let myRole = null;
let serverTimeOffset = 0;
let mySelection = null;
let armorSelections = [];
let currentGame = null;
let currentMe = null;
let knownLinkedId = null;
let lastHandledEvent = null;
let hostAutoClicked = 0;
let hasVotedInVotingRound = false;
let lastVotingPhaseStart = null;
let hasVotedInWolfRound = false;
let lastWolfPhaseStart = null;
let witchActionsCompleted = false;
let lastWitchPhaseStart = null;
let lastKilledNotification = null;
let lastVotedNotification = null;
let phaseCountdownInterval = null;
let activePhaseEndsAtUnix = null;
let hunterShotSubmitted = false;
let lastHunterPhaseStart = null;
const AUTH_STORAGE_KEY = 'ww_username';

// Helper: Unix timestamp now
function nowUnix() { return Math.floor((Date.now() + serverTimeOffset) / 1000); }

// Toast Notification Helper
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after duration
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Hilfsfunktion: Screen wechseln
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function clearContainer(container) {
    if (!container) return;
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function cloneTemplateElement(templateId) {
    const template = document.getElementById(templateId);
    if (!template || !template.content || !template.content.firstElementChild) return null;
    return template.content.firstElementChild.cloneNode(true);
}

function createPlayerCardElement(player, options = {}) {
    const {
        selected = false,
        nonClickable = false,
        visuallyDisabled = false,
        nameSuffix = '',
        dataKey = 'playerId',
        onClick = null
    } = options;

    const card = cloneTemplateElement('tpl-player-card');
    if (!card) return null;

    const playerId = Number(player.id ?? player.player_id);
    const isAlive = Number(player.is_alive) === 1;
    const nameEl = card.querySelector('.player-name');
    if (nameEl) {
        nameEl.textContent = `${player.name}${nameSuffix}`;
    }

    if (dataKey === 'poisonId') {
        card.dataset.poisonId = String(playerId);
    } else {
        card.dataset.playerId = String(playerId);
    }

    if (!isAlive || visuallyDisabled) {
        card.classList.add('dead');
    }

    if (selected) {
        card.classList.add('selected');
    }

    if (typeof onClick === 'function' && isAlive && !nonClickable) {
        card.addEventListener('click', onClick);
    }

    return card;
}

function renderLobbyPlayers(players) {
    const list = document.getElementById('player-list');
    clearContainer(list);

    players.forEach(player => {
        const row = cloneTemplateElement('tpl-lobby-player');
        if (!row) return;
        row.textContent = player.name;
        list.appendChild(row);
    });
}

async function requestJson(url, method = 'GET', body = null, action = 'request') {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const options = { method, signal: controller.signal, headers: {} };
        if (body !== null && body !== undefined) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            console.error('[API Error]', action, 'Status:', response.status, result);
            return result && result.error ? result : { error: 'api_request_failed', status: response.status };
        }

        return result;
    } catch (err) {
        if (err.name === 'AbortError') {
            console.error('[API Timeout]', action);
            return { error: 'api_timeout', message: 'Request timeout' };
        }
        console.error('[API Error]', action, err.message);
        return { error: 'api_request_error', message: err.message };
    }
}

// API Call Helper (legacy action interface -> REST endpoints)
async function api(data) {
    const action = data.action || '';

    if (action === 'create_game') {
        return requestJson('/api/games', 'POST', {
            wolfCount: data.wolfCount,
            wolfTimer: data.wolfTimer,
            discussTimer: data.discussTimer,
            maxPlayers: data.maxPlayers,
            withHunter: data.withHunter
        }, action);
    }

    if (action === 'join_game') {
        const roomCode = String(data.code || '').toUpperCase();
        return requestJson(`/api/games/${encodeURIComponent(roomCode)}/players`, 'POST', {
            name: data.name
        }, action);
    }

    if (action === 'get_state') {
        const roomCode = String(data.code || '').toUpperCase();
        const myId = data.myId ? `?myId=${encodeURIComponent(data.myId)}` : '';
        return requestJson(`/api/games/${encodeURIComponent(roomCode)}${myId}`, 'GET', null, action);
    }

    if (data.code && action) {
        const roomCode = String(data.code || '').toUpperCase();
        const payload = { ...data };
        delete payload.code;
        return requestJson(`/api/games/${encodeURIComponent(roomCode)}/actions`, 'POST', payload, action);
    }

    if (data.code) {
        const roomCode = String(data.code || '').toUpperCase();
        const payload = { ...data };
        delete payload.code;
        return requestJson(`/api/games/${encodeURIComponent(roomCode)}`, 'PATCH', payload, action || 'patch');
    }

    return { error: 'unsupported_action', action };
}

// HOST: Spiel erstellen
async function hostGame() {
    if (!myUsername) {
        return showToast('Bitte zuerst einloggen.', 'error');
    }

    const wolves = document.getElementById('set-wolves').value;
    const maxPlayers = document.getElementById('set-max-players').value;
    const nightTime = Number(document.getElementById('set-night-timer').value || 30);
    const dayTime = Number(document.getElementById('set-day-timer').value || 60);
    const withHunter = Boolean(document.getElementById('set-with-hunter')?.checked);
    const sanitizedNightTime = Number.isFinite(nightTime) && nightTime > 0 ? nightTime : 30;
    const sanitizedDayTime = Number.isFinite(dayTime) && dayTime > 0 ? dayTime : 60;

    const res = await api({
        action: 'create_game',
        wolfCount: wolves,
        nightTimer: sanitizedNightTime,
        dayTimer: sanitizedDayTime,
        wolfTimer: sanitizedNightTime,
        discussTimer: sanitizedDayTime,
        maxPlayers: maxPlayers,
        withHunter: withHunter
    });
    console.log('create_game response', res);
    if (res.code) {
        // Join as host
        const joinRes = await api({ action: 'join_game', code: res.code, name: myUsername });
        if (joinRes.error) return showToast(joinRes.error, 'error');
        gameCode = joinRes.code;
        myPlayerId = joinRes.id;
        isHost = true;
        document.getElementById('lobby-code-display').innerText = "CODE: " + gameCode;
        showScreen('screen-lobby');
        document.getElementById('btn-start-game').style.display = 'block';
        pollingInterval = setInterval(updateGameState, 2000);
    } else {
        showToast('Fehler beim Erstellen der Lobby', 'error');
    }
}

// CLIENT: Spiel beitreten
async function joinGame() {
    const code = document.getElementById('join-code').value.toUpperCase();
    if (!myUsername) {
        return showToast('Bitte zuerst einloggen.', 'error');
    }
    if(!code) return showToast('Bitte Code ausfüllen!', 'error');
    joinGameInternal(code, myUsername);
}

async function joinGameInternal(code, name) {
    const res = await api({ action: 'join_game', code: code, name: name });
    
    if (res.error) return showToast(res.error, 'error');
    if (res.taken_name) return showToast('Name wird bereits benutzt!', 'error');

    gameCode = res.code;
    myPlayerId = res.id;
    myUsername = name;
    
    document.getElementById('lobby-code-display').innerText = "CODE: " + gameCode;
    showScreen('screen-lobby');
    
    // Start Polling (Update Loop)
    pollingInterval = setInterval(updateGameState, 2000);
}

// HOST: Spiel starten
async function startGame() {
    const wolves = document.getElementById('set-wolves').value;
    const players = document.querySelectorAll('.player-item').length;
    if (players < 5) {
        showToast(`Min. 5 Spieler! Aktuell: ${players}`, 'error');
        return;
    }
    document.getElementById('btn-start-game').disabled = true;
    document.getElementById('btn-start-game').innerText = 'Starten...';
    
    try {
        const res = await api({ action: 'start_game', code: gameCode, wolfCount: wolves });
        if (res.error) {
            showToast(`Fehler: ${res.error}`, 'error');
            document.getElementById('btn-start-game').disabled = false;
            document.getElementById('btn-start-game').innerText = 'Spiel starten';
            return;
        }
        // Sofort einen State-Update triggern um zum Game-Screen zu wechseln
        await updateGameState();
    } catch (err) {
        console.error('startGame error:', err);
        showToast('Fehler beim Spielstart: ' + err.message, 'error');
        document.getElementById('btn-start-game').disabled = false;
        document.getElementById('btn-start-game').innerText = 'Spiel starten';
    }
}

// MAIN LOOP: Status abfragen
async function updateGameState() {
    if (!gameCode) return;

    try {
        const state = await api({ action: 'get_state', code: gameCode, myId: myPlayerId });
        
        if (state.error) {
            console.error('get_state error:', state.error);
            return;
        }
        
        const game = state.game;
        const players = state.players;
        const me = state.me;

        currentGame = game;
        currentMe = me;

        // sync server time offset
        if (state.server_time) serverTimeOffset = state.server_time*1000 - Date.now();

        // sync visible countdown with server phase timestamp
        if (game.game_phase === 'lobby' || game.game_phase === 'gameover') {
            stopPhaseCountdown();
            const timerEl = document.getElementById('game-timer');
            if (timerEl) timerEl.textContent = '';
        } else {
            startPhaseCountdown(state.phase_ends_at_unix);
        }

        // 1. Lobby Update
        if (game.game_phase === 'lobby') {
            renderLobbyPlayers(players);
        } 
        
        // 2. Spielstart erkannt -> Wechsel zum Game Screen
        else if (game.game_phase !== 'lobby' && currentPhase === 'lobby') {
            showScreen('screen-game');
            currentPhase = game.game_phase;
            
            // Rolle anzeigen
            myRole = me.role;
            document.getElementById('my-role-name').innerText = "Rolle: " + translateRole(myRole);
            // Bild laden (stellt sicher, dass Pfad stimmt)
            document.getElementById('my-role-img').src = `database/img/${getRoleImage(myRole)}`;
        }

        // 3. Phasen-Update im Spiel
        updateGameUI(game, players, me, state);
    } catch (err) {
        console.error('updateGameState error:', err);
    }
}

function updateGameUI(game, players, me, state) {
    // Show username at top
    document.getElementById('my-username').innerText = `👤 ${myUsername}`;
    const isHunterRevengeShooter = Boolean(
        me &&
        me.role === 'hunter' &&
        game.game_phase === 'hunter_revenge' &&
        Number(game.hunter_revenge_player_id) === Number(myPlayerId)
    );
    
    // Show next-phase button for host OR for active role player
    const nextBtn = document.getElementById('btn-next-phase');
    const canAdvancePhase = (isHost || isMyTurn(game, me)) && game.game_phase !== 'hunter_revenge';
    if (canAdvancePhase && game.game_phase !== 'gameover') {
        nextBtn.style.display = 'block';
        // Update button text based on who can click it
        if (isHost && !isMyTurn(game, me)) {
            nextBtn.textContent = '➡️ NÄCHSTE PHASE (Host)';
        } else if (isMyTurn(game, me)) {
            nextBtn.textContent = '➡️ NÄCHSTE PHASE';
        }
    } else {
        nextBtn.style.display = 'none';
    }
    
    // notify if linked changed
    if (me && me.linked_user_id && knownLinkedId !== me.linked_user_id) {
        knownLinkedId = me.linked_user_id;
        const partner = players.find(p => p.id == knownLinkedId);
        if (partner) showToast('💕 Du wurdest verkuppelt mit: ' + partner.name, 'success');
    }
    
    const isDead = me && me.is_alive === 0;
    // Check if I was killed
    if (isDead && !isHunterRevengeShooter && currentPhase !== 'lobby') {
        // Show death overlay and keep it updated
        showDeathScreen(players);
    }
    
    if (state.last_night_victim && state.last_night_event && state.last_night_event !== lastKilledNotification) {
        if (state.last_night_victim === myPlayerId) {
            const killedEvent = state.last_night_event;
            if (killedEvent.includes('killed:') || killedEvent.includes('pending_kill:')) {
                lastKilledNotification = state.last_night_event;
                showToast('💀 Du wurdest getötet!', 'danger', 5000);
            }
        }
    }
    
    // Check if I was voted out
    if (state.last_night_event && state.last_night_event.startsWith('voted:')) {
        const votedId = state.last_night_event.split(':')[1];
        if (votedId && votedId !== 'none' && parseInt(votedId) === myPlayerId && state.last_night_event !== lastVotedNotification) {
            lastVotedNotification = state.last_night_event;
            showToast('🗳️ Du wurdest rausgevotet!', 'danger');
        }
    }
    
    const phaseLabel = game.game_phase === 'night'
        ? `Nacht (${translatePhase(game.night_step)})`
        : (game.game_phase === 'hunter_revenge'
            ? 'Jäger-Rache'
            : (game.game_phase === 'gameover' ? 'Spielende' : (game.night_step === 'voting' ? 'Tag (Abstimmung)' : 'Tag (Diskussion)')));
    document.getElementById('game-phase').innerText = phaseLabel;
    document.body.classList.toggle('night', game.game_phase === 'night');
    
    // Handle last night / vote events globally so we show results when host advances
    if (state.last_night_event && state.last_night_event !== lastHandledEvent) {
        lastHandledEvent = state.last_night_event;
        const ev = state.last_night_event;
        if (ev.startsWith('voted:')) {
            const id = ev.split(':')[1];
            if (id && id !== 'none') {
                const p = players.find(x => x.id == id);
                showToast((p ? p.name : 'Jemand') + ' wurde rausgevotet.', 'info');
            } else {
                showToast('Keine Person wurde rausgevotet.', 'info');
            }
        } else if (ev.startsWith('killed:')) {
            const id = ev.split(':')[1];
            const p = players.find(x => x.id == id);
            showToast((p ? p.name : 'Jemand') + ' ist gestorben.', 'danger');
        } else if (ev.startsWith('saved:')) {
            showToast('Jemand wäre gestorben, wurde aber gerettet.', 'success');
        } else if (ev.startsWith('poisoned:')) {
            const id = ev.split(':')[1];
            const p = players.find(x => x.id == id);
            showToast('Jemand wurde vergiftet: ' + (p ? p.name : 'Jemand'), 'danger');
        } else if (ev.startsWith('hunter_shot:')) {
            showToast('Jäger hat einen Schuss abgegeben.', 'warning');
        }
    }

    // close voting modal automatically if we're not in voting phase or if dead
    if (isDead || !(game.game_phase === 'day' && game.night_step === 'voting')) {
        closeVotingModal();
    }
    // close wolf modal automatically if we're not in wolf phase or if dead
    if (isDead || !(game.game_phase === 'night' && game.night_step === 'wolf')) {
        const wolfModal = document.getElementById('wolf-modal');
        if (wolfModal) wolfModal.style.display = 'none';
        hasVotedInWolfRound = false; // Reset when leaving wolf phase
    }
    if (isDead) {
        const witchModal = document.getElementById('witch-modal');
        if (witchModal) witchModal.style.display = 'none';
        const poisonModal = document.getElementById('witch-poison-modal');
        if (poisonModal) poisonModal.style.display = 'none';
        const seerModal = document.getElementById('seer-modal');
        if (seerModal) seerModal.style.display = 'none';
    }
    document.body.classList.toggle('day', game.game_phase === 'day');
    document.body.classList.toggle('hunter-revenge', game.game_phase === 'hunter_revenge');
    document.getElementById('phase-icon').innerText = game.game_phase === 'night' ? '🌙' : (game.game_phase === 'hunter_revenge' ? '🎯' : '☀️');

    const actionText = document.getElementById('action-text');
    const playerGrid = document.getElementById('game-players');

    // Countdown wird über startPhaseCountdown() synchronisiert aktualisiert

    // Rendering der Spielerliste im Spiel
    clearContainer(playerGrid);
    players.forEach(p => {
        const playerId = Number(p.id ?? p.player_id);
        const canClickInHunterRevenge = isHunterRevengeShooter && Number(p.is_alive) === 1 && playerId !== Number(myPlayerId);
        const canClick = game.game_phase === 'hunter_revenge'
            ? canClickInHunterRevenge
            : playerId !== Number(myPlayerId);
        const card = createPlayerCardElement(p, {
            selected: mySelection === playerId || armorSelections.includes(playerId),
            nonClickable: !canClick,
            onClick: canClick ? () => selectPlayer(playerId) : null
        });
        if (card) {
            playerGrid.appendChild(card);
        }
    });

    // Role-specific UI hints
    if (!isDead && game.game_phase === 'night' && game.night_step === 'wolf' && myRole === 'wolf') {
        actionText.innerText = "Wähle ein Opfer! (Wölfe müssen 'FERTIG' drücken wenn alle entschieden haben)";
        
        // Track wolf voting round to prevent modal reopen
        const wolfPhaseId = `${game.game_phase}_${game.night_step}_${state.phase_ends_at_unix}`;
        if (lastWolfPhaseStart !== wolfPhaseId) {
            lastWolfPhaseStart = wolfPhaseId;
            hasVotedInWolfRound = false;
        }
        
        // Show wolf modal for voting only if haven't voted yet
        if (!hasVotedInWolfRound) {
            const wolfModal = document.getElementById('wolf-modal');
            if (wolfModal) {
            const wolfPlayers = document.getElementById('wolf-players');
            if (wolfPlayers) {
                clearContainer(wolfPlayers);
                players.forEach(p => {
                    const playerId = Number(p.id ?? p.player_id);
                    const isWolf = p.role === 'wolf';
                    const card = createPlayerCardElement(p, {
                        selected: mySelection === playerId,
                        nonClickable: isWolf,
                        visuallyDisabled: isWolf,
                        nameSuffix: isWolf ? ' (Wolf)' : '',
                        onClick: () => selectPlayer(playerId)
                    });
                    if (card) {
                        wolfPlayers.appendChild(card);
                    }
                });
            }
            
            // Show finish button only if someone selected
            const finishBtn = document.getElementById('wolf-finish-btn');
            if (mySelection) {
                finishBtn.style.display = 'block';
            } else {
                finishBtn.style.display = 'none';
            }
            
            wolfModal.style.display = 'flex';
        }
        }
        
        // live wolf votes
        updateWolfLiveVotes();
    } else if (!isDead && game.game_phase === 'night' && game.night_step === 'armor' && myRole === 'armor') {
        if (currentMe && currentMe.armor_used) {
            actionText.innerText = "⚠️ Du hast dein Token bereits verbraucht - du kannst nichts mehr tun.";
        } else {
            actionText.innerText = "💍 Wähle zwei Spieler zum Verkuppeln (1 Token verfügbar).";
        }
    } else if (game.game_phase === 'night' && game.night_step === 'armor') {
        actionText.innerText = "Armor erwacht...";
    } else if (!isDead && game.game_phase === 'night' && game.night_step === 'witch' && myRole === 'witch') {
        const potions = currentMe?.potions_left || '00';
        const canHeal = potions[0] === '1';
        const canPoison = potions[1] === '1';
        
        // Track which witch phase we're in to prevent modal reappearing
        const witchPhaseId = `${game.game_phase}_${game.night_step}_${state.phase_ends_at_unix}`;
        if (lastWitchPhaseStart !== witchPhaseId) {
            lastWitchPhaseStart = witchPhaseId;
            witchActionsCompleted = false;
            witchActions = { heal: false, poison: null }; // Initialize actions for new phase
            // ONLY open modal on NEW phase start, not on every update
            if (!canHeal && !canPoison) {
                actionText.innerText = '🧪 Hexe hat keine Tränke mehr...';
            } else {
                actionText.innerText = '🧪 Hexe erwacht... Wähle deine Aktionen!';
                showWitchModal(players, state.last_night_victim, canHeal, canPoison);
            }
        } else {
            // Same phase - just update text without reopening modal
            if (!canHeal && !canPoison) {
                actionText.innerText = '🧪 Hexe hat keine Tränke mehr...';
            } else if (!witchActionsCompleted) {
                actionText.innerText = '🧪 Hexe erwacht... Wähle deine Aktionen!';
            } else {
                actionText.innerText = '🧪 Hexe wartet auf nächste Phase...';
            }
        }
    } else if (!isDead && game.game_phase === 'night' && game.night_step === 'seer' && myRole === 'seer') {
        actionText.innerText = "Wähle jemanden, um die Rolle zu sehen.";
    } else if (!isDead && game.game_phase === 'day' && game.night_step === 'voting') {
        actionText.innerText = "Abstimmung läuft! Klicke auf eine Person zum Abstimmen.";
        // Track voting round to prevent re-opening modal after vote
        const votingPhaseId = `${game.game_phase}_${game.night_step}_${state.phase_ends_at_unix}`;
        if (lastVotingPhaseStart !== votingPhaseId) {
            lastVotingPhaseStart = votingPhaseId;
            hasVotedInVotingRound = false;
        }
        // show voting modal only if haven't voted yet
        if (!hasVotedInVotingRound) {
            showVotingWindow(players);
        }
    } else if (game.game_phase === 'hunter_revenge') {
        const hunterPhaseId = `${game.game_phase}_${game.hunter_revenge_player_id}_${state.phase_ends_at_unix}`;
        if (lastHunterPhaseStart !== hunterPhaseId) {
            lastHunterPhaseStart = hunterPhaseId;
            hunterShotSubmitted = false;
            mySelection = null;
        }

        if (isHunterRevengeShooter && !hunterShotSubmitted) {
            actionText.innerText = '🎯 Du bist der Jäger! Wähle ein letztes Opfer.';
        } else if (isHunterRevengeShooter && hunterShotSubmitted) {
            actionText.innerText = '🎯 Schuss abgegeben. Warte auf den nächsten Phasenwechsel.';
        } else {
            actionText.innerText = 'Jäger-Rache: Nur der gestorbene Jäger darf jetzt wählen.';
        }
    } else if (game.game_phase === 'day') {
        if (state.last_night_event && state.last_night_event !== lastHandledEvent) {
            lastHandledEvent = state.last_night_event;
            // format event
            const ev = state.last_night_event;
            if (ev.startsWith('killed:')) {
                const id = ev.split(':')[1];
                const p = players.find(x => x.id == id);
                showToast((p ? p.name : 'Jemand') + ' ist gestorben.', 'danger');
            } else if (ev.startsWith('saved:')) {
                const id = ev.split(':')[1];
                showToast('Jemand wäre gestorben, wurde aber gerettet.', 'success');
            } else if (ev.startsWith('poisoned:')) {
                const id = ev.split(':')[1];
                const p = players.find(x => x.id == id);
                showToast('Jemand wurde vergiftet: ' + (p ? p.name : 'Jemand'), 'danger');
            } else if (ev.startsWith('hunter_shot:')) {
                showToast('Jäger hat einen Schuss abgegeben.', 'warning');
            }
        }
    } else if (game.game_phase === 'gameover' || state.winner) {
        // Game over UI
        document.getElementById('gameover-title').innerText = state.winner === 'wolves' ? 'Wölfe gewinnen' : 'Dorf gewinnt';
        document.getElementById('gameover-text').innerText = `Gewinner: ${state.winner}`;
        showScreen('screen-gameover');
        // stop polling
        clearInterval(pollingInterval);
        stopPhaseCountdown();
    } else {
        actionText.innerText = "Schlaf gut...";
    }

}

function selectPlayer(targetId) {
    // Diese Funktion sendet die Wahl an die API
    console.log("Gewählt: " + targetId);
    mySelection = targetId;
    // Visuelles Markieren
    document.querySelectorAll('.player-card').forEach(el => el.classList.remove('selected'));
    const sel = document.querySelector(`.player-card[data-player-id='${targetId}']`);
    if (sel) sel.classList.add('selected');

    // Verhalten nach Rolle/Phase
    if (currentGame && currentGame.game_phase === 'hunter_revenge') {
        const isActiveHunter = currentMe && currentMe.role === 'hunter' && Number(currentGame.hunter_revenge_player_id) === Number(myPlayerId);
        if (!isActiveHunter || hunterShotSubmitted) {
            return;
        }

        api({
            action: 'perform_action',
            code: gameCode,
            playerId: myPlayerId,
            targetId: targetId,
            hunter_shot: 1
        }).then(res => {
            if (res.error) {
                return showToast(res.error, 'error');
            }

            hunterShotSubmitted = true;
            showToast('🎯 Jäger-Schuss abgegeben!', 'warning');
        });
        return;
    }

    if (currentGame && currentGame.game_phase === 'night' && currentGame.night_step === 'armor' && myRole === 'armor') {
        if (currentMe && currentMe.armor_used) return; // already used
        // toggle selection
        if (armorSelections.includes(targetId)) {
            armorSelections = armorSelections.filter(x => x !== targetId);
        } else {
            if (armorSelections.length < 2 && targetId !== myPlayerId) armorSelections.push(targetId);
        }
        // update visual
        document.querySelectorAll('.player-card').forEach(el => el.classList.remove('selected'));
        armorSelections.forEach(id => {
            const el = document.querySelector(`.player-card[data-player-id='${id}']`);
            if (el) el.classList.add('selected');
        });
        if (armorSelections.length === 2) {
            // send armor_link
            api({ action: 'armor_link', code: gameCode, armorId: myPlayerId, playerA: armorSelections[0], playerB: armorSelections[1] })
            .then(res => {
                if (res.error) return showToast(res.error, 'error');
                showToast('✅ Verkuppelt!', 'success');
                armorSelections = [];
            });
        }
        return;
    } else if (currentGame && currentGame.game_phase === 'night' && currentGame.night_step === 'wolf' && myRole === 'wolf') {
        // For wolf phase: register selection but don't auto-submit; show "Fertig" button
        api({ action: 'wolf_vote', code: gameCode, voterId: myPlayerId, targetId: targetId });
        // Show finish button
        const finishBtn = document.getElementById('wolf-finish-btn');
        if (finishBtn) {
            finishBtn.style.display = 'block';
        }
    } else if (myRole === 'seer' && currentGame && currentGame.game_phase === 'night' && currentGame.night_step === 'seer') {
        // Seher darf nur während seiner Phase schauen
        api({ action: 'seer_peek', code: gameCode, seerId: myPlayerId, targetId: targetId }).then(res => {
            if (res.error) return showToast(res.error, 'error');
            document.getElementById('seer-result').innerText = `Rolle: ${translateRole(res.role)}`;
            document.getElementById('seer-modal').style.display = 'flex';
            showToast('🔮 Du siehst die Rolle!', 'info');
        });
    } else if (currentGame && currentGame.game_phase === 'day' && currentGame.night_step === 'voting') {
        // For voting: just mark selection; confirm button handles submission
        // Update confirm button visibility
        const confirmBtn = document.getElementById('voting-confirm-btn');
        if (confirmBtn) {
            confirmBtn.style.display = 'block';
        }
    }
}

function closeSeerModal() { document.getElementById('seer-modal').style.display = 'none'; }

function closeWitchModal() { 
    document.getElementById('witch-modal').style.display = 'none';
    const poisonModal = document.getElementById('witch-poison-modal');
    if (poisonModal) poisonModal.style.display = 'none';
}

function showWitchModal(players, victimId, canHeal, canPoison) {
    const modal = document.getElementById('witch-modal');
    if (!modal) return;
    
    // Only reset witch actions on FIRST call for this phase (not on every modal show)
    // Actions are managed throughout the phase interaction
    
    const witchText = document.getElementById('witch-text');
    const healBtn = document.getElementById('witch-heal-btn');
    const poisonBtn = document.getElementById('witch-poison-btn');
    
    // Update text based on victim
    if (victimId) {
        const victim = players.find(p => p.id == victimId);
        if (victim) {
            witchText.innerText = `🐺 Die Wölfe haben ${victim.name} gewählt! Kannst du retten?`;
        } else {
            witchText.innerText = '🐺 Die Wölfe haben jemanden gewählt!';
        }
    } else {
        witchText.innerText = '✅ Die Wölfe haben niemanden getötet (Glück!).';
    }
    
    // Buttons anzeigen IMMER - aber disabled wenn kein Trank
    if (canHeal && victimId) {
        healBtn.style.display = 'block';
        healBtn.disabled = false;
        healBtn.style.opacity = '1';
        healBtn.onclick = () => { useWitch('heal'); };
    } else if (!canHeal && victimId) {
        healBtn.style.display = 'block';
        healBtn.disabled = true;
        healBtn.style.opacity = '0.5';
        healBtn.textContent = '❤️ HEILEN (kein Trank)';
        healBtn.onclick = null;
    } else {
        healBtn.style.display = 'none';
    }
    
    // Show poison button
    if (canPoison) {
        poisonBtn.style.display = 'block';
        poisonBtn.disabled = false;
        poisonBtn.style.opacity = '1';
        poisonBtn.onclick = () => { showPoisonSelection(players); };
    } else {
        poisonBtn.style.display = 'none';
    }
    
    modal.style.display = 'flex';
}

function showPoisonSelection(players) {
    // Create poison modal if it doesn't exist
    let poisonModal = document.getElementById('witch-poison-modal');
    if (!poisonModal) {
        poisonModal = cloneTemplateElement('tpl-poison-modal');
        if (!poisonModal) return;
        const cancelButton = poisonModal.querySelector('#poison-cancel-btn');
        if (cancelButton) {
            cancelButton.addEventListener('click', closePoisonModal);
        }
        document.body.appendChild(poisonModal);
    }
    
    // Populate with players
    const poisonGrid = document.getElementById('poison-players');
    
    if (poisonGrid) {
        clearContainer(poisonGrid);
        players
            .filter(p => Number(p.is_alive) === 1 && Number(p.id ?? p.player_id) !== Number(myPlayerId))
            .forEach(p => {
                const playerId = Number(p.id ?? p.player_id);
                const card = createPlayerCardElement(p, {
                    dataKey: 'poisonId',
                    onClick: () => selectPoisonTarget(playerId)
                });
                if (card) {
                    poisonGrid.appendChild(card);
                }
            });
    }
    
    poisonModal.style.display = 'flex';
}

function closePoisonModal() {
    const poisonModal = document.getElementById('witch-poison-modal');
    if (poisonModal) poisonModal.style.display = 'none';
}

function selectPoisonTarget(targetId) {
    // Mark selection
    document.querySelectorAll('#poison-players .player-card').forEach(el => {
        el.classList.remove('selected');
    });
    const selected = document.querySelector(`#poison-players .player-card[data-poison-id="${targetId}"]`);
    if (selected) {
        selected.classList.add('selected');
    }
    
    // Show confirm button
    const confirmBtn = document.getElementById('poison-confirm-btn');
    if (confirmBtn) {
        confirmBtn.style.display = 'block';
        confirmBtn.onclick = () => { 
            useWitch('poison', targetId);
            closePoisonModal(); // Close poison modal after selection
        };
    }
}

function showVotingWindow(players) {
    const modal = document.getElementById('voting-modal');
    if (!modal) return;
    
    // Populate voting grid with players
    const votingGrid = document.getElementById('voting-players');
    if (votingGrid) {
        clearContainer(votingGrid);
        players.forEach(p => {
            const playerId = Number(p.id ?? p.player_id);
            const card = createPlayerCardElement(p, {
                selected: mySelection === playerId,
                onClick: () => selectPlayer(playerId)
            });
            if (card) {
                votingGrid.appendChild(card);
            }
        });
    }
    
    // Show confirm button only if someone selected
    const confirmBtn = document.getElementById('voting-confirm-btn');
    if (mySelection) {
        confirmBtn.style.display = 'block';
    } else {
        confirmBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function closeVotingModal() { 
    document.getElementById('voting-modal').style.display = 'none'; 
}

// New function: Confirm vote and close modal
async function confirmVote() {
    if (!mySelection) {
        showToast('Bitte wähle jemanden!', 'error');
        return;
    }
    
    try {
        // Submit vote
        const res = await api({ action: 'perform_action', code: gameCode, playerId: myPlayerId, targetId: mySelection });
        console.log('Vote response:', res);
        
        if (res.error) {
            showToast(res.error, 'error');
            return;
        }
        
        hasVotedInVotingRound = true;
        mySelection = null; // Clear selection after vote
        closeVotingModal();
        showToast('✅ Stimme abgegeben! Warte auf nächste Phase...', 'success');
        console.log('Vote submitted successfully');
    } catch (err) {
        console.error('Vote error:', err);
        showToast('Fehler beim Abstimmen: ' + err.message, 'error');
    }
}

// New function: Confirm wolf vote and close modal
async function confirmWolfVote() {
    if (!mySelection) {
        showToast('Bitte wähle ein Opfer!', 'error');
        return;
    }
    
    hasVotedInWolfRound = true; // Mark as voted to prevent reopen
    document.getElementById('wolf-modal').style.display = 'none';
    showToast('✅ Auswahl bestätigt! Warte auf andere Wölfe...', 'success');
}

async function nextPhaseManual() {
    try {
        const res = await api({ action: 'next_phase', code: gameCode });
        if (res.error && res.error !== 'server_error') {
            return showToast(res.error, 'error');
        }
        // State wird beim nächsten Polling geholt
    } catch (err) {
        console.error('nextPhaseManual error:', err);
        showToast('Fehler: ' + err.message, 'error');
    }
}

let witchActions = { heal: false, poison: null };

async function useWitch(type, targetId=null) {
    if (type === 'heal') {
        witchActions.heal = true;
        showToast('✅ Heilung vorbereitet!', 'success');
        const healBtn = document.getElementById('witch-heal-btn');
        if (healBtn) {
            healBtn.disabled = true;
            healBtn.style.opacity = '0.5';
            healBtn.textContent = '❤️ ✓ GEHEILT';
        }
    } else if (type === 'poison' && targetId) {
        witchActions.poison = targetId;
        showToast('💀 Gift vorbereitet!', 'warning');
        const poisonBtn = document.querySelector('#witch-poison-btn');
        if (poisonBtn) {
            poisonBtn.disabled = true;
            poisonBtn.style.opacity = '0.5';
            poisonBtn.textContent = '☠️ ✓ VERGIFTET';
        }
    }
}

async function commitWitchActions() {
    try {
        // Only proceed if witch has selected at least one action or deliberately skips
        const res = await api({ 
            action: 'use_witch', 
            code: gameCode, 
            witchId: myPlayerId, 
            heal: witchActions.heal, 
            poison: witchActions.poison 
        });
        if (res.error) {
            console.warn('Witch action error:', res.error);
            // Don't show error for 'no_heal'/'no_poison' - witch might not have used both
            if (res.error !== 'no_heal' && res.error !== 'no_poison' && !res.error.includes('already')) {
                showToast(res.error, 'error');
            }
        }
        
        // Mark as completed regardless of error
        witchActionsCompleted = true;
        
        // Reset
        witchActions = { heal: false, poison: null };
        closeWitchModal();
        showToast('✅ Hexe-Aktionen abgeschlossen!', 'success');
    } catch (err) {
        console.error('commitWitchActions error:', err);
        // Don't block with error - just mark as complete
        witchActionsCompleted = true;
        closeWitchModal();
    }
}

// Live update of wolf votes (only for wolves)
async function updateWolfLiveVotes() {
    if (!gameCode || myRole !== 'wolf') return;
    try {
        const res = await api({ action: 'get_wolf_votes', code: gameCode });
        if (!res.wolves) return;
        // Mark players according to wolves' choices
        // Count and mark if multiple wolves select same target
        const counts = {};
        res.wolves.forEach(w => { if (w.target_id) counts[w.target_id] = (counts[w.target_id]||0)+1; });
        // Clear previous live markers
        document.querySelectorAll('.player-card').forEach(el => el.classList.remove('live-target'));
        Object.keys(counts).forEach(tid => {
            const el = document.querySelector(`.player-card[data-player-id='${tid}']`);
            if (el) el.classList.add('live-target');
        });
    } catch (err) {
        console.error('updateWolfLiveVotes error:', err);
    }
}

// Show death screen overlay
function showDeathScreen(players) {
    const existing = document.getElementById('death-overlay');
    if (existing) {
        updateDeathRoles(players);
        return; // Already showing
    }
    
    const overlay = cloneTemplateElement('tpl-death-overlay');
    if (!overlay) return;

    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(50, 0, 0, 0.9) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(8px);
    `;

    const content = overlay.querySelector('#death-overlay-content');
    if (!content) return;
    content.style.cssText = `
        text-align: center;
        color: #ff6666;
        font-size: 2em;
        padding: 40px;
        background: rgba(20, 0, 0, 0.8);
        border: 3px solid #ff3333;
        border-radius: 20px;
        box-shadow: 0 0 30px rgba(255, 50, 50, 0.8);
    `;

    const icon = overlay.querySelector('#death-overlay-icon');
    if (icon) icon.style.cssText = 'font-size: 5em; margin-bottom: 20px; animation: pulse 1.5s infinite;';

    const title = overlay.querySelector('#death-overlay-title');
    if (title) title.style.cssText = 'font-size: 2.5em; font-weight: bold; margin-bottom: 15px;';

    const subtitle = overlay.querySelector('#death-overlay-subtitle');
    if (subtitle) subtitle.style.cssText = 'font-size: 1em; color: #ff9999; margin-bottom: 10px;';

    const roles = overlay.querySelector('#death-roles');
    if (roles) roles.style.cssText = 'font-size: 0.9em; color: #ddd; margin-top: 20px; text-align: left;';

    const footer = overlay.querySelector('#death-overlay-footer');
    if (footer) footer.style.cssText = 'font-size: 0.9em; color: #aaa; margin-top: 20px; border-top: 1px solid #555; padding-top: 15px;';

    document.body.appendChild(overlay);
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);
    
    // Overlay stays permanently - user is dead for the rest of the game
    updateDeathRoles(players);
}

function updateDeathRoles(players) {
    const rolesBox = document.getElementById('death-roles');
    if (!rolesBox || !players || players.length === 0) return;
    clearContainer(rolesBox);

    const hasRoles = players.some(p => p.role);
    if (!hasRoles) {
        const info = document.createElement('div');
        info.textContent = 'Rollen werden angezeigt, sobald sie aufgedeckt sind.';
        rolesBox.appendChild(info);
        return;
    }

    const heading = document.createElement('div');
    heading.textContent = 'Rollen';
    heading.style.fontWeight = 'bold';
    heading.style.marginBottom = '8px';
    rolesBox.appendChild(heading);

    players.forEach(p => {
        const roleName = p.role ? translateRole(p.role) : 'Unbekannt';
        const status = p.is_alive === 0 ? '☠️' : '✅';
        const row = cloneTemplateElement('tpl-death-role-row') || document.createElement('div');
        row.textContent = `${status} ${p.name}: ${roleName}`;
        rolesBox.appendChild(row);
    });
}

// Check if it's current player's turn to act
function isMyTurn(game, me) {
    if (!game || !me || game.game_phase === 'lobby' || game.game_phase === 'gameover') return false;
    if (me.is_alive === 0) return false;
    
    // During day discussion/voting, no specific role turn
    if (game.game_phase === 'day') return false;
    
    // During night, check if my role matches current phase
    if (game.game_phase === 'night' && game.night_step) {
        return me.role === game.night_step;
    }
    
    return false;
}

// Hilfsfunktionen
function translateRole(role) {
    const roles = { 'wolf': 'Werwolf', 'seer': 'Seherin', 'witch': 'Hexe', 'armor': 'Armor', 'hunter': 'Jäger', 'villager': 'Dorfbewohner' };
    return roles[role] || role;
}
function translatePhase(step) {
    if(!step) return "";
    const steps = { 'armor': 'Armor erwacht', 'seer': 'Seherin erwacht', 'wolf': 'Wölfe jagen', 'witch': 'Hexe erwacht' };
    return steps[step] || step;
}
function getRoleImage(role) {
    const map = { 'wolf': 'wolf.png', 'seer': 'seherin.png', 'witch': 'hexe.png', 'armor': 'armor.png', 'hunter': 'jaeger.png', 'villager': 'dorfbewohner.png' };
    return map[role] || 'dorfbewohner.png';
}

function formatCountdown(totalSeconds) {
    const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stopPhaseCountdown() {
    if (phaseCountdownInterval) {
        clearInterval(phaseCountdownInterval);
        phaseCountdownInterval = null;
    }
    activePhaseEndsAtUnix = null;
}

function renderCountdownLabel(secondsLeft) {
    const timerEl = document.getElementById('game-timer');
    if (!timerEl) return;
    timerEl.textContent = `⏱️ ${formatCountdown(secondsLeft)}`;
}

function startPhaseCountdown(phaseEndsAtUnix) {
    const endsAt = Number(phaseEndsAtUnix);
    if (!Number.isFinite(endsAt) || endsAt <= 0) {
        stopPhaseCountdown();
        const timerEl = document.getElementById('game-timer');
        if (timerEl) timerEl.textContent = '';
        return;
    }

    if (activePhaseEndsAtUnix === endsAt && phaseCountdownInterval) {
        return;
    }

    stopPhaseCountdown();
    activePhaseEndsAtUnix = endsAt;

    const tick = () => {
        const remaining = Math.max(0, endsAt - nowUnix());
        renderCountdownLabel(remaining);
        if (remaining <= 0 && phaseCountdownInterval) {
            clearInterval(phaseCountdownInterval);
            phaseCountdownInterval = null;
        }
    };

    tick();
    phaseCountdownInterval = setInterval(tick, 1000);
}

(function initAuthGate() {
    updateUserLabels();

    if (myUsername) {
        unlockGameUi();
        return;
    }

    lockGameUi();
})();

function updateUserLabels() {
    const startLabel = document.getElementById('current-user-label');
    if (startLabel) startLabel.textContent = myUsername || '...';
    const joinLabel = document.getElementById('join-user-label');
    if (joinLabel) joinLabel.textContent = myUsername || '...';
}

function unlockGameUi() {
    const authGate = document.getElementById('auth-gate');
    const gameApp = document.getElementById('game-app');
    if (authGate) authGate.style.display = 'none';
    if (gameApp) gameApp.style.display = 'block';
    showScreen('screen-start');
    updateUserLabels();
}

function lockGameUi() {
    const authGate = document.getElementById('auth-gate');
    const gameApp = document.getElementById('game-app');
    if (authGate) authGate.style.display = 'block';
    if (gameApp) gameApp.style.display = 'none';
}

function resetClientGameState() {
    gameCode = null;
    myPlayerId = null;
    isHost = false;
    currentPhase = 'lobby';
    myRole = null;
    mySelection = null;
    armorSelections = [];
    currentGame = null;
    currentMe = null;
    knownLinkedId = null;
    lastHandledEvent = null;
    hasVotedInVotingRound = false;
    lastVotingPhaseStart = null;
    hasVotedInWolfRound = false;
    lastWolfPhaseStart = null;
    witchActionsCompleted = false;
    lastWitchPhaseStart = null;
    lastKilledNotification = null;
    lastVotedNotification = null;
    hunterShotSubmitted = false;
    lastHunterPhaseStart = null;
    stopPhaseCountdown();

    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

function logoutUser() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    myUsername = null;
    resetClientGameState();
    lockGameUi();
    showToast('Du wurdest ausgeloggt.', 'info');
}

function persistUsername(username) {
    myUsername = String(username || '').trim();
    sessionStorage.setItem(AUTH_STORAGE_KEY, myUsername);
    updateUserLabels();
}

async function registerUser() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!username || !password) {
        return showToast('Bitte Username und Passwort ausfüllen.', 'error');
    }

    const res = await requestJson('/api/auth/register', 'POST', { username, password }, 'register');
    if (res.error) {
        if (res.error === 'username_already_exists') {
            return showToast('Username ist bereits vergeben.', 'error');
        }
        return showToast('Registrierung fehlgeschlagen.', 'error');
    }

    persistUsername(res.username || username);
    unlockGameUi();
    showToast('Registrierung erfolgreich.', 'success');
}

async function loginUser() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!username || !password) {
        return showToast('Bitte Username und Passwort ausfüllen.', 'error');
    }

    const res = await requestJson('/api/auth/login', 'POST', { username, password }, 'login');
    if (res.error) {
        return showToast('Login fehlgeschlagen.', 'error');
    }

    persistUsername(res.username || username);
    unlockGameUi();
    showToast('Login erfolgreich.', 'success');
}