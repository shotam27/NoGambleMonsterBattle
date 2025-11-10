const mongoose = require('mongoose');

async function checkPokemonBattle() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pokemon-battle');
    console.log('✅ Connected to pokemon-battle database\n');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('=' .repeat(60));
    console.log('📂 pokemon-battle データベース');
    console.log('='.repeat(60) + '\n');
    
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`📊 ${coll.name}: ${count}件`);
      
      if (count > 0 && count < 50) {
        const docs = await mongoose.connection.db.collection(coll.name).find({}).limit(5).toArray();
        console.log('\n   サンプルデータ:');
        docs.forEach((doc, i) => {
          console.log(`   ${i + 1}. ${JSON.stringify(doc, null, 2).substring(0, 200)}...`);
        });
      }
      console.log('');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPokemonBattle();
