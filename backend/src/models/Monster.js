const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['fire', 'water', 'grass', 'normal', 'light', 'dark']
  },
  power: {
    type: Number,
    required: true
  },
  priority: {
    type: Number,
    default: 1
  },
  category: {
    type: String,
    required: true,
    enum: ['physical', 'magical', 'status'],
    default: 'physical'
  },
  statusEffect: {
    type: String,
    enum: ['poison', 'paralysis', 'sleep'],
    required: false
  },
  statChange: {
    target: {
      type: String,
      enum: ['self', 'opponent']
    },
    stat: {
      type: String,
      enum: ['attack', 'defense', 'magicAttack', 'magicDefense', 'speed']
    },
    stages: {
      type: Number,
      min: -2,
      max: 2
    }
  }
});

const monsterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: [String],  // 配列に変更して複合タイプ対応
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0 && v.length <= 2;  // 1〜2タイプまで
      },
      message: 'Monster must have 1 or 2 types'
    }
  },
  stats: {
    hp: {
      type: Number,
      required: true
    },
    attack: {
      type: Number,
      required: true
    },
    defense: {
      type: Number,
      required: true
    },
    magicAttack: {
      type: Number,
      required: true
    },
    magicDefense: {
      type: Number,
      required: true
    },
    speed: {
      type: Number,
      required: true
    }
  },
  moves: [moveSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Monster', monsterSchema);
