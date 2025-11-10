const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Monster = require('./src/models/Monster');

// Load environment variables
dotenv.config();

async function addInjectionMove() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 注射技のデータ
    const injectionMove = {
      id: 'injection',
      name: '注射',
      type: 'normal',
      power: 0,
      priority: 0,
      category: 'status',
      causesInjection: true
    };

    // すべてのモンスターを取得
    const monsters = await Monster.find({});
    console.log(`Found ${monsters.length} monsters`);

    // 各モンスターの技リストを表示
    for (const monster of monsters) {
      console.log(`\n${monster.name}:`);
      console.log('  Current moves:', monster.moves.map(m => m.name).join(', '));
    }

    // 注射技を追加するモンスターを選択
    const monstersToUpdate = ['グラスリー', 'アクアス', 'ノーマルン'];

    let updatedCount = 0;
    for (const monsterName of monstersToUpdate) {
      const monster = monsters.find(m => m.name === monsterName);
      if (monster) {
        // すでに注射技を持っているかチェック
        const hasInjection = monster.moves.some(m => m.id === 'injection');
        if (!hasInjection) {
          monster.moves.push(injectionMove);
          await monster.save();
          console.log(`\n✓ Added '注射' to ${monster.name}`);
          updatedCount++;
        } else {
          console.log(`\n- ${monster.name} already has '注射'`);
        }
      } else {
        console.log(`\n✗ Monster '${monsterName}' not found`);
      }
    }

    console.log(`\n\n=== Summary ===`);
    console.log(`Total monsters checked: ${monsters.length}`);
    console.log(`Monsters updated: ${updatedCount}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addInjectionMove();
