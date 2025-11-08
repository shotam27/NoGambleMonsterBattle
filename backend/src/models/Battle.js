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
  }
}, { _id: false });

const battleSchema = new mongoose.Schema({
  player: {
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
  timestamps: true
});

module.exports = mongoose.model('Battle', battleSchema);
