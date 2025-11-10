const mongoose = require('mongoose');

async function findOldData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/');
    console.log('✅ Connected to Local MongoDB\n');
    
    // すべてのデータベースをリスト
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    
    console.log('=' .repeat(60));
    console.log('📂 利用可能なデータベース');
    console.log('='.repeat(60));
    
    for (const db of databases) {
      console.log(`\n📁 ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      
      // monster関連のDBをチェック
      if (db.name.toLowerCase().includes('monster') || db.name === 'local' || db.name === 'test') {
        const dbConn = mongoose.connection.useDb(db.name);
        const collections = await dbConn.db.listCollections().toArray();
        
        if (collections.length > 0) {
          console.log('   コレクション:');
          for (const coll of collections) {
            const count = await dbConn.db.collection(coll.name).countDocuments();
            console.log(`     - ${coll.name}: ${count}件`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 monster_battle以外に古いデータベースがあれば復元可能です');
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findOldData();
