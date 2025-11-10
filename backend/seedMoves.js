const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Move = require('./src/models/Move');

// Load environment variables
dotenv.config();

// すべての技データ（既存のmonsterData.jsonから抽出し、新しい技も追加）
const movesData = [
  // 炎タイプ技
  { id: 'fire_blast', name: '火炎放射', type: 'fire', power: 100, priority: 0, category: 'magical' },
  { id: 'fire_strike', name: '炎の打撃', type: 'fire', power: 80, priority: 0, category: 'physical' },
  { id: 'quick_attack', name: '電光石火', type: 'fire', power: 85, priority: 1, category: 'physical' },
  
  // 水タイプ技
  { id: 'water_gun', name: '水鉄砲', type: 'water', power: 90, priority: 0, category: 'magical' },
  { id: 'aqua_tail', name: 'アクアテール', type: 'water', power: 90, priority: 0, category: 'physical' },
  { id: 'water_pulse', name: '水の波動', type: 'water', power: 95, priority: 0, category: 'magical' },
  
  // 草タイプ技
  { id: 'vine_whip', name: 'つるのムチ', type: 'grass', power: 100, priority: 0, category: 'physical' },
  { id: 'leaf_blade', name: 'リーフブレード', type: 'grass', power: 100, priority: 0, category: 'physical' },
  { id: 'grass_knot', name: '草結び', type: 'grass', power: 85, priority: 0, category: 'magical' },
  { id: 'solar_beam', name: 'ソーラービーム', type: 'grass', power: 150, priority: 0, category: 'magical' },
  
  // 光タイプ技
  { id: 'light_wave', name: 'ひかりのはどう', type: 'light', power: 110, priority: 0, category: 'magical' },
  
  // 闇タイプ技
  { id: 'dark_wave', name: 'やみのはどう', type: 'dark', power: 110, priority: 0, category: 'magical' },
  
  // ノーマルタイプ技
  { id: 'normal_punch', name: '普通パンチ', type: 'normal', power: 80, priority: 0, category: 'physical' },
  { id: 'normal_beam', name: 'ノーマルビーム', type: 'normal', power: 90, priority: 0, category: 'magical' },
  { id: 'body_slam', name: 'のしかかり', type: 'normal', power: 85, priority: 0, category: 'physical' },
  
  // ステータス技
  {
    id: 'swords_dance',
    name: '剣の舞',
    type: 'normal',
    power: 0,
    priority: 0,
    category: 'status',
    statChange: { target: 'self', stat: 'attack', stages: 2 }
  },
  {
    id: 'dragon_dance',
    name: '竜の舞',
    type: 'normal',
    power: 0,
    priority: 0,
    category: 'status',
    statChange: { target: 'self', stat: 'speed', stages: 2 }
  },
  {
    id: 'intimidate',
    name: '威嚇',
    type: 'normal',
    power: 0,
    priority: 0,
    category: 'status',
    statChange: { target: 'opponent', stat: 'attack', stages: -1 }
  },
  
  // 特殊効果技
  {
    id: 'u-turn',
    name: 'とんぼ返り',
    type: 'grass',
    power: 70,
    priority: 0,
    category: 'physical',
    switchAfterAttack: true
  },
  {
    id: 'volt-switch',
    name: 'ボルトチェンジ',
    type: 'light',
    power: 70,
    priority: 0,
    category: 'magical',
    switchAfterAttack: true
  },
  {
    id: 'substitute',
    name: '分身',
    type: 'normal',
    power: 0,
    priority: 0,
    category: 'status',
    createsSubstitute: true
  },
  {
    id: 'injection',
    name: '注射',
    type: 'normal',
    power: 0,
    priority: 0,
    category: 'status',
    causesInjection: true
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding moves');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedMoves = async () => {
  try {
    // Clear existing moves
    await Move.deleteMany({});
    console.log('Cleared existing moves');

    // Insert new moves
    const moves = await Move.insertMany(movesData);
    console.log(`Inserted ${moves.length} moves`);
    
    // Display inserted moves
    moves.forEach(move => {
      console.log(`- ${move.name} (${move.id})`);
    });
  } catch (error) {
    console.error(`Error seeding moves: ${error.message}`);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await seedMoves();
  await mongoose.connection.close();
  console.log('\nMoves seeding completed');
};

run();
