const mongoose = require('mongoose');

const partyMemberSchema = new mongoose.Schema({
  monsterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monster',
    required: true
  },
  currentHp: {
    type: Number,
    required: true
  },
  maxHp: {
    type: Number,
    required: true
  },
  isFainted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['none', 'poison', 'paralysis', 'sleep'],
    default: 'none'
  },
  sleepTurnsRemaining: {
    type: Number,
    default: 0
  },
  statModifiers: {
    attack: { type: Number, default: 0, min: -2, max: 2 },
    defense: { type: Number, default: 0, min: -2, max: 2 },
    magicAttack: { type: Number, default: 0, min: -2, max: 2 },
    magicDefense: { type: Number, default: 0, min: -2, max: 2 },
    speed: { type: Number, default: 0, min: -2, max: 2 }
  }
}, { 
  _id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const battleSchema = new mongoose.Schema({
  player: {
    userId: String, // For PvP detection
    party: [partyMemberSchema],
    activeIndex: {
      type: Number,
      default: 0
    },
    selectedAction: {
      type: {
        type: String,
        enum: ['move', 'switch'],
        default: null
      },
      moveId: String,
      switchToIndex: Number
    }
  },
  opponent: {
    userId: String, // For PvP detection
    party: [partyMemberSchema],
    activeIndex: {
      type: Number,
      default: 0
    },
    selectedAction: {
      type: {
        type: String,
        enum: ['move', 'switch'],
        default: null
      },
      moveId: String,
      switchToIndex: Number
    }
  },
  turn: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'finished', 'waiting_for_actions', 'waiting_for_switch'],
    default: 'waiting_for_actions'
  },
  battleType: {
    type: String,
    enum: ['ai', 'pvp'],
    default: 'ai'
  },
  winner: {
    type: String,
    enum: ['player', 'opponent', 'draw'],
    default: null
  },
  lastMove: {
    attacker: String,
    moveId: String,
    damage: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Battle', battleSchema);
