const Monster = require('../models/Monster');

// Get monster data
exports.getMonsterData = async (monsterId) => {
  return await Monster.findById(monsterId);
};

// Validate monster exists
exports.validateMonster = async (monsterId) => {
  const monster = await Monster.findById(monsterId);
  return monster !== null;
};
