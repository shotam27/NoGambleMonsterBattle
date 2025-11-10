const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function showAtlasDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const moveSchema = new mongoose.Schema({}, { strict: false });
    const monsterSchema = new mongoose.Schema({}, { strict: false });
    
    const Move = mongoose.model('Move', moveSchema);
    const Monster = mongoose.model('Monster', monsterSchema);
    
    console.log('=' .repeat(60));
    console.log('🎯 MOVES (技)');
    console.log('='.repeat(60));
    
    const moves = await Move.find({}).sort({ id: 1 });
    moves.forEach((move, index) => {
      console.log(`\n${index + 1}. ${move.name} (${move.id || 'NO ID'})`);
      console.log(`   タイプ: ${move.type}`);
      console.log(`   威力: ${move.power} | 分類: ${move.category}`);
      if (move.description) console.log(`   説明: ${move.description}`);
      if (move.statusEffect) console.log(`   状態異常: ${move.statusEffect}`);
      if (move.statChange) console.log(`   能力変化: ${JSON.stringify(move.statChange)}`);
      if (move.switchAfterAttack) console.log(`   🔄 攻撃後交換`);
      if (move.createsSubstitute) console.log(`   👥 分身作成`);
      if (move.causesInjection) console.log(`   💉 注射効果`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🐾 MONSTERS (モンスター)');
    console.log('='.repeat(60));
    
    const monsters = await Monster.find({}).populate({ path: 'moves', strictPopulate: false }).sort({ id: 1 });
    monsters.forEach((monster, index) => {
      console.log(`\n${index + 1}. ${monster.name} (${monster.id || 'NO ID'})`);
      console.log(`   タイプ: ${monster.type.join(', ')}`);
      console.log(`   ステータス:`);
      console.log(`     HP: ${monster.stats.hp} | 攻撃: ${monster.stats.attack} | 防御: ${monster.stats.defense}`);
      console.log(`     特攻: ${monster.stats.magicAttack} | 特防: ${monster.stats.magicDefense} | 素早さ: ${monster.stats.speed}`);
      console.log(`   技 (${monster.moves.length}個):`);
      monster.moves.forEach(move => {
        console.log(`     - ${move.name} (${move.id})`);
      });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 SUMMARY`);
    console.log('='.repeat(60));
    console.log(`Total Moves: ${moves.length}`);
    console.log(`Total Monsters: ${monsters.length}`);
    console.log(`Database: monster-battle`);
    console.log(`Cluster: monsterbattle.gzznpqm.mongodb.net`);
    console.log('='.repeat(60) + '\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showAtlasDetails();
