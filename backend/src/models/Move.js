const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
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
    default: 0
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
  },
  switchAfterAttack: {
    type: Boolean,
    default: false
  },
  createsSubstitute: {
    type: Boolean,
    default: false
  },
  causesInjection: {
    type: Boolean,
    default: false
  },
  isProtect: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Move', moveSchema);
