const Monster = require('../models/Monster');

// Get all monsters
exports.getAllMonsters = async (req, res) => {
  try {
    const monsters = await Monster.find().populate('moves');
    res.status(200).json(monsters);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

// Get monster by ID
exports.getMonsterById = async (req, res) => {
  try {
    const monster = await Monster.findById(req.params.id).populate('moves');
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
    const populated = await Monster.findById(monster._id).populate('moves');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
};

// Update monster
exports.updateMonster = async (req, res) => {
  try {
    const monster = await Monster.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('moves');
    
    if (!monster) {
      return res.status(404).json({ error: true, message: 'Monster not found' });
    }
    res.status(200).json(monster);
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
};

// Delete monster
exports.deleteMonster = async (req, res) => {
  try {
    const monster = await Monster.findByIdAndDelete(req.params.id);
    if (!monster) {
      return res.status(404).json({ error: true, message: 'Monster not found' });
    }
    res.status(200).json({ message: 'Monster deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};
