const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Monster = require('./src/models/Monster');
const monsterData = require('../shared/data/monsterData.json');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Seed database
const seedDatabase = async () => {
  try {
    // Clear existing monsters
    await Monster.deleteMany({});
    console.log('Cleared existing monsters');

    // Insert new monsters
    const monsters = await Monster.insertMany(monsterData);
    console.log(`Inserted ${monsters.length} monsters`);

    monsters.forEach((monster) => {
      console.log(`- ${monster.name} (${monster.type})`);
    });

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

// Run seeding
connectDB().then(() => seedDatabase());
