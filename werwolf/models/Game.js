const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema(
  {
    player_id: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    role: {
      type: String,
      enum: ['unknown', 'wolf', 'seer', 'witch', 'armor', 'hunter', 'villager'],
      default: 'unknown'
    },
    is_alive: {
      type: Number,
      enum: [0, 1],
      default: 1
    },
    is_ready: {
      type: Number,
      enum: [0, 1],
      default: 0
    },
    seer_used: {
      type: Number,
      enum: [0, 1],
      default: 0
    },
    armor_used: {
      type: Number,
      enum: [0, 1],
      default: 0
    },
    target_id: {
      type: Number,
      default: null
    },
    linked_user_id: {
      type: Number,
      default: null
    },
    potions_left: {
      type: String,
      default: '11'
    },
    last_seen: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    day_timer: {
      type: Number,
      default: 60,
      min: 5
    },
    night_timer: {
      type: Number,
      default: 30,
      min: 5
    },
    with_hunter: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const GameSchema = new mongoose.Schema(
  {
    room_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 5,
      maxlength: 6
    },
    game_phase: {
      type: String,
      enum: ['lobby', 'night', 'day', 'hunter_revenge', 'gameover'],
      default: 'lobby'
    },
    night_step: {
      type: String,
      enum: ['armor', 'seer', 'wolf', 'witch', 'voting', null],
      default: null
    },
    phase_ends_at: {
      type: Date,
      default: null
    },
    winner: {
      type: String,
      enum: ['village', 'wolves', null],
      default: null
    },
    max_players: {
      type: Number,
      default: 8
    },
    wolf_timer: {
      type: Number,
      default: 20
    },
    discussion_timer: {
      type: Number,
      default: 120
    },
    settings: {
      type: SettingsSchema,
      default: () => ({ day_timer: 60, night_timer: 30, with_hunter: true })
    },
    wolf_count: {
      type: Number,
      default: 1
    },
    last_night_victim: {
      type: Number,
      default: null
    },
    last_night_event: {
      type: String,
      default: null
    },
    first_day_passed: {
      type: Number,
      enum: [0, 1],
      default: 0
    },
    hunter_revenge_player_id: {
      type: Number,
      default: null
    },
    hunter_revenge_return_phase: {
      type: String,
      enum: ['night', 'day', null],
      default: null
    },
    hunter_revenge_return_step: {
      type: String,
      enum: ['armor', 'seer', 'wolf', 'witch', 'voting', null],
      default: null
    },
    players: {
      type: [PlayerSchema],
      default: []
    },
    next_player_id: {
      type: Number,
      default: 1
    }
  },
  {
    collection: 'games',
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

module.exports = mongoose.model('Game', GameSchema);
