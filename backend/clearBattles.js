const mongoose = require('mongoose');
const Battle = require('./src/models/Battle');

async function clearBattles() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/monster-battle', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected for clearing battles');

    // Delete all battles
    const result = await Battle.deleteMany({});
    console.log(`Deleted ${result.deletedCount} battles`);

    console.log('Battle cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing battles:', error);
    process.exit(1);
  }
}

clearBattles();
