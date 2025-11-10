const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Monster = require('./src/models/Monster');

// Load environment variables
dotenv.config();

async function addSubstituteMove() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 分身技のデータ
    const substituteMove = {
      id: 'substitute',
      name: '分身',
      type: 'normal',
      power: 0,
      priority: 0,
      category: 'status',
      createsSubstitute: true
    };

    // すべてのモンスターを取得
    const monsters = await Monster.find({});
    console.log(`Found ${monsters.length} monsters`);

    // 各モンスターの技リストを表示
    for (const monster of monsters) {
      console.log(`\n${monster.name}:`);
      console.log('  Current moves:', monster.moves.map(m => m.name).join(', '));
    }

    // 分身技を追加するモンスターを選択（例：全モンスターに追加）
    // ここでは例として、最初の3体のモンスターに追加
    const monstersToUpdate = ['フォレスタ', 'ハイドロン', 'インフェルノ'];

    let updatedCount = 0;
    for (const monsterName of monstersToUpdate) {
      const monster = monsters.find(m => m.name === monsterName);
      if (monster) {
        // すでに分身技を持っているかチェック
        const hasSubstitute = monster.moves.some(m => m.id === 'substitute');
        if (!hasSubstitute) {
          monster.moves.push(substituteMove);
          await monster.save();
          console.log(`\n✓ Added '分身' to ${monster.name}`);
          updatedCount++;
        } else {
          console.log(`\n- ${monster.name} already has '分身'`);
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

addSubstituteMove();
