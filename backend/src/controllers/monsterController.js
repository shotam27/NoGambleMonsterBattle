const Monster = require('../models/Monster');

// Get all monsters
exports.getAllMonsters = async (req, res) => {
  try {
    const monsters = await Monster.find();
    res.status(200).json(monsters);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

// Get monster by ID
exports.getMonsterById = async (req, res) => {
  try {
    const monster = await Monster.findById(req.params.id);
    if (!monster) {
      return res.status(404).json({ error: true, message: 'Monster not found' });
    }
    res.status(200).json(monster);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

// Create new monster
exports.createMonster = async (req, res) => {
  try {
    const monster = new Monster(req.body);
    await monster.save();
    res.status(201).json(monster);
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
};
