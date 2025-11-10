const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Monster = require('./src/models/Monster');
const Move = require('./src/models/Move');

// Load environment variables
dotenv.config();

// モンスターデータ（技はIDのみ）
const monstersData = [
  {
    id: 'fire_rabbit',
    name: 'ファイロ',
    type: ['fire'],
    stats: { hp: 110, attack: 140, defense: 60, magicAttack: 130, magicDefense: 70, speed: 180 },
    moveIds: ['fire_blast', 'fire_strike', 'quick_attack', 'swords_dance']
  },
  {
    id: 'water_turtle',
    name: 'アクアス',
    type: ['water'],
    stats: { hp: 130, attack: 120, defense: 80, magicAttack: 110, magicDefense: 80, speed: 150 },
    moveIds: ['water_gun', 'aqua_tail', 'water_pulse', 'dragon_dance', 'injection']
  },
  {
    id: 'grass_bird',
    name: 'グラスリー',
    type: ['grass'],
    stats: { hp: 125, attack: 130, defense: 100, magicAttack: 100, magicDefense: 90, speed: 120 },
    moveIds: ['vine_whip', 'leaf_blade', 'grass_knot', 'intimidate', 'injection']
  },
  {
    id: 'fire_light_phoenix',
    name: 'インフェルノ',
    type: ['fire', 'light'],
    stats: { hp: 100, attack: 120, defense: 70, magicAttack: 150, magicDefense: 80, speed: 170 },
    moveIds: ['fire_blast', 'light_wave', 'quick_attack', 'volt-switch', 'substitute']
  },
  {
    id: 'water_dark_serpent',
    name: 'ハイドロン',
    type: ['water', 'dark'],
    stats: { hp: 140, attack: 110, defense: 90, magicAttack: 130, magicDefense: 90, speed: 130 },
    moveIds: ['water_gun', 'dark_wave', 'water_pulse', 'substitute']
  },
  {
    id: 'grass_forest',
    name: 'フォレスタ',
    type: ['grass'],
    stats: { hp: 115, attack: 100, defense: 110, magicAttack: 140, magicDefense: 100, speed: 110 },
    moveIds: ['vine_whip', 'solar_beam', 'grass_knot', 'u-turn', 'substitute']
  },
  {
    id: 'normal_basic',
    name: 'ノーマルン',
    type: ['normal'],
    stats: { hp: 150, attack: 100, defense: 100, magicAttack: 100, magicDefense: 100, speed: 100 },
    moveIds: ['normal_punch', 'normal_beam', 'body_slam', 'grass_knot', 'injection']
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Seed database
const seedDatabase = async () => {
  try {
    // Clear existing monsters
    await Monster.deleteMany({});
    console.log('Cleared existing monsters');

    // 技IDをObjectIdに変換
    for (const monsterData of monstersData) {
      const moveObjectIds = [];
      for (const moveId of monsterData.moveIds) {
        const move = await Move.findOne({ id: moveId });
        if (move) {
          moveObjectIds.push(move._id);
        } else {
          console.warn(`Warning: Move '${moveId}' not found for ${monsterData.name}`);
        }
      }
      
      const monster = await Monster.create({
        id: monsterData.id,
        name: monsterData.name,
        type: monsterData.type,
        stats: monsterData.stats,
        moves: moveObjectIds
      });
      
      console.log(`- ${monster.name} (${monster.type.join(',')})`);
    }
    
    console.log(`\nInserted ${monstersData.length} monsters`);

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

// Run seeding
connectDB().then(() => seedDatabase());
