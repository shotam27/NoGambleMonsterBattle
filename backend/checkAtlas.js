const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function checkAtlasData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Atlas\n');
    
    const moveSchema = new mongoose.Schema({}, { strict: false });
    const monsterSchema = new mongoose.Schema({}, { strict: false });
    
    const Move = mongoose.model('Move', moveSchema);
    const Monster = mongoose.model('Monster', monsterSchema);
    
    const moves = await Move.find({});
    const monsters = await Monster.find({});
    
    console.log(`📊 Current Atlas Data:`);
    console.log(`   Moves: ${moves.length}`);
    console.log(`   Monsters: ${monsters.length}\n`);
    
    if (moves.length > 0) {
      console.log('🎯 Sample Moves:');
      moves.slice(0, 5).forEach(m => {
        console.log(`   - ${m.name} (id: ${m.id || 'NO ID'})`);
      });
    }
    
    if (monsters.length > 0) {
      console.log('\n🐾 Sample Monsters:');
      monsters.slice(0, 5).forEach(m => {
        console.log(`   - ${m.name} (id: ${m.id || 'NO ID'})`);
      });
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAtlasData();
