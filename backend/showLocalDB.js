const mongoose = require('mongoose');

async function showLocalDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/monster_battle');
    console.log('✅ Connected to Local MongoDB\n');
    
    const moveSchema = new mongoose.Schema({}, { strict: false });
    const monsterSchema = new mongoose.Schema({}, { strict: false });
    const battleSchema = new mongoose.Schema({}, { strict: false });
    
    const Move = mongoose.model('Move', moveSchema);
    const Monster = mongoose.model('Monster', monsterSchema);
    const Battle = mongoose.model('Battle', battleSchema);
    
    const moves = await Move.find({});
    const monsters = await Monster.find({});
    const battles = await Battle.find({});
    
    console.log('=' .repeat(60));
    console.log('📊 LOCAL DATABASE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Moves: ${moves.length}`);
    console.log(`Monsters: ${monsters.length}`);
    console.log(`Battles: ${battles.length}`);
    console.log('='.repeat(60) + '\n');
    
    if (moves.length > 0) {
      console.log('🎯 MOVES (技)\n');
      moves.forEach((move, index) => {
        console.log(`${index + 1}. ${move.name || 'NO NAME'} (id: ${move.id || 'NO ID'})`);
        if (move.type) console.log(`   タイプ: ${move.type} | 威力: ${move.power}`);
      });
      console.log('');
    } else {
      console.log('🎯 MOVES: (空)\n');
    }
    
    if (monsters.length > 0) {
      console.log('🐾 MONSTERS (モンスター)\n');
      monsters.forEach((monster, index) => {
        console.log(`${index + 1}. ${monster.name || 'NO NAME'} (id: ${monster.id || 'NO ID'})`);
        if (monster.type) console.log(`   タイプ: ${Array.isArray(monster.type) ? monster.type.join(', ') : monster.type}`);
        if (monster.stats) {
          console.log(`   HP: ${monster.stats.hp} | 攻撃: ${monster.stats.attack} | 素早さ: ${monster.stats.speed}`);
        }
        if (monster.moves) {
          console.log(`   技: ${monster.moves.length}個`);
        }
      });
      console.log('');
    } else {
      console.log('🐾 MONSTERS: (空)\n');
    }
    
    if (battles.length > 0) {
      console.log(`⚔️ BATTLES: ${battles.length}件\n`);
      const activeBattles = battles.filter(b => b.status !== 'finished');
      const finishedBattles = battles.filter(b => b.status === 'finished');
      console.log(`   進行中: ${activeBattles.length}`);
      console.log(`   終了: ${finishedBattles.length}`);
      console.log('');
    } else {
      console.log('⚔️ BATTLES: (空)\n');
    }
    
    console.log('='.repeat(60));
    console.log('Database: monster_battle');
    console.log('Connection: mongodb://localhost:27017');
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 ローカルMongoDBが起動していない可能性があります');
    process.exit(1);
  }
}

showLocalDB();
