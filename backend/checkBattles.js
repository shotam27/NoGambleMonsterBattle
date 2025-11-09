const mongoose = require('mongoose');
const Battle = require('./src/models/Battle');

async function checkBattles() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/monster-battle', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');

    // Find all battles
    const battles = await Battle.find({});
    console.log(`Found ${battles.length} battles`);
    
    battles.forEach((battle, index) => {
      console.log(`\nBattle ${index + 1}:`);
      console.log('ID:', battle._id);
      console.log('Status:', battle.status);
      console.log('Created:', battle.createdAt);
    });

    // Delete all if requested
    if (process.argv[2] === '--delete-all') {
      const result = await Battle.deleteMany({});
      console.log(`\nDeleted ${result.deletedCount} battles`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBattles();
