const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// ローカルとAtlasの接続
const localUri = 'mongodb://localhost:27017/monster_battle';
const atlasUri = process.env.MONGODB_URI;

// Mongooseモデル
const moveSchema = new mongoose.Schema({}, { strict: false });
const monsterSchema = new mongoose.Schema({}, { strict: false });
const battleSchema = new mongoose.Schema({}, { strict: false });

async function migrateData() {
  try {
    console.log('🔄 Starting migration...\n');
    
    // ローカルDBに接続
    console.log('📡 Connecting to local MongoDB...');
    const localConn = await mongoose.createConnection(localUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to local MongoDB\n');
    
    // ローカルのモデルを作成
    const LocalMove = localConn.model('Move', moveSchema);
    const LocalMonster = localConn.model('Monster', monsterSchema);
    const LocalBattle = localConn.model('Battle', battleSchema);
    
    // データを取得
    console.log('📦 Fetching data from local DB...');
    const moves = await LocalMove.find({}).lean();
    const monsters = await LocalMonster.find({}).lean();
    const battles = await LocalBattle.find({}).lean();
    
    console.log(`   Moves: ${moves.length}`);
    console.log(`   Monsters: ${monsters.length}`);
    console.log(`   Battles: ${battles.length}\n`);
    
    // ローカル接続を閉じる
    await localConn.close();
    console.log('🔌 Closed local connection\n');
    
    // Atlasに接続
    console.log('📡 Connecting to MongoDB Atlas...');
    const atlasConn = await mongoose.createConnection(atlasUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to Atlas\n');
    
    // Atlasのモデルを作成
    const AtlasMove = atlasConn.model('Move', moveSchema);
    const AtlasMonster = atlasConn.model('Monster', monsterSchema);
    const AtlasBattle = atlasConn.model('Battle', battleSchema);
    
    // 既存のデータをクリア（オプション）
    console.log('🗑️  Clearing existing Atlas data...');
    await AtlasMove.deleteMany({});
    await AtlasMonster.deleteMany({});
    await AtlasBattle.deleteMany({});
    console.log('✅ Cleared\n');
    
    // データをインサート
    console.log('⬆️  Uploading data to Atlas...');
    
    if (moves.length > 0) {
      // idフィールドがnullの技を除外
      const validMoves = moves.filter(m => m.id != null);
      console.log(`   Filtering moves: ${moves.length} -> ${validMoves.length} (removed ${moves.length - validMoves.length} with null id)`);
      
      if (validMoves.length > 0) {
        await AtlasMove.insertMany(validMoves);
        console.log(`   ✅ Uploaded ${validMoves.length} moves`);
      }
    }
    
    if (monsters.length > 0) {
      // idフィールドがnullのモンスターを除外
      const validMonsters = monsters.filter(m => m.id != null);
      console.log(`   Filtering monsters: ${monsters.length} -> ${validMonsters.length} (removed ${monsters.length - validMonsters.length} with null id)`);
      
      if (validMonsters.length > 0) {
        await AtlasMonster.insertMany(validMonsters);
        console.log(`   ✅ Uploaded ${validMonsters.length} monsters`);
      }
    }
    
    if (battles.length > 0) {
      await AtlasBattle.insertMany(battles);
      console.log(`   ✅ Uploaded ${battles.length} battles`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
    // Atlas接続を閉じる
    await atlasConn.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrateData();
