const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ability = require('./src/models/Ability');

dotenv.config();

const abilities = [
  {
    id: 'intimidate',
    name: 'いかく',
    effectType: 'statChange',
    statChange: {
      targetSide: 'opponent',
      stat: 'attack',
      stages: -1
    },
    description: '登場時、相手の攻撃を1段階下げる'
  },
  {
    id: 'download',
    name: 'ダウンロード',
    effectType: 'statChange',
    statChange: {
      targetSide: 'self',
      stat: 'magicAttack',
      stages: 1
    },
    description: '登場時、自分の魔法攻撃を1段階上げる'
  },
  {
    id: 'levitate',
    name: 'ふゆう',
    effectType: 'typeResistance',
    typeResistance: {
      type: 'grass',
      multiplier: 0
    },
    description: '草タイプの技を無効化する'
  },
  {
    id: 'water-absorb',
    name: 'ちょすい',
    effectType: 'typeResistance',
    typeResistance: {
      type: 'water',
      multiplier: 0
    },
    description: '水タイプの技を無効化する'
  },
  {
    id: 'flash-fire',
    name: 'もらいび',
    effectType: 'typeResistance',
    typeResistance: {
      type: 'fire',
      multiplier: 0
    },
    description: '炎タイプの技を無効化する'
  },
  {
    id: 'volt-absorb',
    name: 'ちくでん',
    effectType: 'typeResistance',
    typeResistance: {
      type: 'light',
      multiplier: 0
    },
    description: '光タイプの技を無効化する'
  },
  {
    id: 'competitive',
    name: 'かちき',
    effectType: 'statChange',
    statChange: {
      targetSide: 'self',
      stat: 'magicAttack',
      stages: 2
    },
    description: '登場時、自分の魔法攻撃を2段階上げる'
  },
  {
    id: 'defiant',
    name: 'まけんき',
    effectType: 'statChange',
    statChange: {
      targetSide: 'self',
      stat: 'attack',
      stages: 2
    },
    description: '登場時、自分の攻撃を2段階上げる'
  },
  {
    id: 'thick-fat',
    name: 'あついしぼう',
    effectType: 'typeResistance',
    typeResistance: {
      type: 'fire',
      multiplier: 0.5
    },
    description: '炎タイプの技のダメージを半減する'
  },
  {
    id: 'filter',
    name: 'フィルター',
    effectType: 'typeResistance',
    typeResistance: {
      type: 'water',
      multiplier: 0.25
    },
    description: '水タイプの技のダメージを1/4にする'
  },
  {
    id: 'regenerator',
    name: 'さいせいりょく',
    effectType: 'heal',
    healPercentage: 33,
    description: '登場時、最大HPの33%を回復する'
  },
  {
    id: 'natural-cure',
    name: 'しぜんかいふく',
    effectType: 'heal',
    healPercentage: 25,
    description: '登場時、最大HPの25%を回復する'
  }
];

const seedAbilities = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');
    console.log('Clearing existing abilities...');
    
    await Ability.deleteMany({});
    console.log('Existing abilities cleared');

    console.log('Inserting abilities...');
    const result = await Ability.insertMany(abilities);
    console.log(`Successfully inserted ${result.length} abilities`);

    console.log('\nAbility List:');
    result.forEach(ability => {
      console.log(`- ${ability.name} (${ability.id}): ${ability.description}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding abilities:', error);
    process.exit(1);
  }
};

seedAbilities();
