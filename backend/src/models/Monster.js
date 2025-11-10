const mongoose = require('mongoose');

const monsterSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
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
  moves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Move'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Monster', monsterSchema);
