const mongoose = require('mongoose');

const abilitySchema = new mongoose.Schema({
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
  effectType: {
    type: String,
    required: true,
    enum: ['statChange', 'typeResistance', 'heal'],
    description: '能力操作 or 技タイプ耐性 or 回復'
  },
  // 能力操作用のフィールド
  statChange: {
    targetSide: {
      type: String,
      enum: ['self', 'opponent'],
      description: '相手 or 自分'
    },
    stat: {
      type: String,
      enum: ['attack', 'defense', 'magicAttack', 'magicDefense', 'speed'],
      description: 'どの能力か'
    },
    stages: {
      type: Number,
      min: -2,
      max: 2,
      description: '何段階か'
    }
  },
  // 技タイプ耐性用のフィールド
  typeResistance: {
    type: {
      type: String,
      enum: ['fire', 'water', 'grass', 'normal', 'light', 'dark'],
      description: 'どのタイプか'
    },
    multiplier: {
      type: Number,
      enum: [0, 0.25, 0.5],
      description: 'ダメージ倍率 (0=無効, 0.25=1/4, 0.5=半減)'
    }
  },
  // 回復用のフィールド
  healPercentage: {
    type: Number,
    min: 1,
    max: 100,
    description: '回復するHP割合(%)'
  },
  description: {
    type: String,
    required: true,
    description: '効果説明文'
  }
}, {
  timestamps: true
});

// バリデーション: effectTypeに応じて必要なフィールドをチェック
abilitySchema.pre('save', function(next) {
  if (this.effectType === 'statChange') {
    if (!this.statChange || !this.statChange.targetSide || !this.statChange.stat || this.statChange.stages === undefined) {
      return next(new Error('statChange requires targetSide, stat, and stages'));
    }
  } else if (this.effectType === 'typeResistance') {
    if (!this.typeResistance || !this.typeResistance.type || this.typeResistance.multiplier === undefined) {
      return next(new Error('typeResistance requires type and multiplier'));
    }
  } else if (this.effectType === 'heal') {
    if (!this.healPercentage) {
      return next(new Error('heal requires healPercentage'));
    }
  }
  next();
});

const Ability = mongoose.model('Ability', abilitySchema);

module.exports = Ability;
