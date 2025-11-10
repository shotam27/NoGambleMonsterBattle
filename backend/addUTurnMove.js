const mongoose = require('mongoose');
const Monster = require('./src/models/Monster');
require('dotenv').config();

// MongoDB接続
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/monster_battle')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function addUTurnMove() {
  try {
    // とんぼ返りの技データ
    const uTurnMove = {
      id: 'u-turn',
      name: 'とんぼ返り',
      type: 'grass',
      power: 70,
      priority: 0,
      category: 'physical',
      switchAfterAttack: true
    };

    // ボルトチェンジ（電気版のとんぼ返り）
    const voltSwitchMove = {
      id: 'volt-switch',
      name: 'ボルトチェンジ',
      type: 'light',
      power: 70,
      priority: 0,
      category: 'magical',
      switchAfterAttack: true
    };

    // すべてのモンスターを取得
    const monsters = await Monster.find({});
    
    console.log(`Found ${monsters.length} monsters`);
    
    let updatedCount = 0;
    
    for (const monster of monsters) {
      let updated = false;
      
      // 草タイプのモンスターにとんぼ返りを追加
      if (monster.type.includes('grass')) {
        // 既に持っていないかチェック
        const hasUTurn = monster.moves.some(m => m.id === 'u-turn');
        if (!hasUTurn && monster.moves.length < 4) {
          monster.moves.push(uTurnMove);
          updated = true;
          console.log(`Added とんぼ返り to ${monster.name}`);
        }
      }
      
      // 光タイプのモンスターにボルトチェンジを追加
      if (monster.type.includes('light')) {
        // 既に持っていないかチェック
        const hasVoltSwitch = monster.moves.some(m => m.id === 'volt-switch');
        if (!hasVoltSwitch && monster.moves.length < 4) {
          monster.moves.push(voltSwitchMove);
          updated = true;
          console.log(`Added ボルトチェンジ to ${monster.name}`);
        }
      }
      
      if (updated) {
        await monster.save();
        updatedCount++;
      }
    }
    
    console.log(`\nUpdated ${updatedCount} monsters with switch-after-attack moves`);
    
    // 追加された技を持つモンスターを表示
    const monstersWithUTurn = await Monster.find({ 'moves.id': 'u-turn' });
    const monstersWithVoltSwitch = await Monster.find({ 'moves.id': 'volt-switch' });
    
    console.log('\nMonsters with とんぼ返り:');
    monstersWithUTurn.forEach(m => console.log(`- ${m.name}`));
    
    console.log('\nMonsters with ボルトチェンジ:');
    monstersWithVoltSwitch.forEach(m => console.log(`- ${m.name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addUTurnMove();
