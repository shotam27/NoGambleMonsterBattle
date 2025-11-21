const Ability = require('../models/Ability');

// 全特性の取得
const getAllAbilities = async (req, res) => {
  try {
    const abilities = await Ability.find().sort({ id: 1 });
    res.status(200).json(abilities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch abilities', error: error.message });
  }
};

// 特性の作成
const createAbility = async (req, res) => {
  try {
    const ability = new Ability(req.body);
    await ability.save();
    res.status(201).json(ability);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create ability', error: error.message });
  }
};

// 特性の更新
const updateAbility = async (req, res) => {
  try {
    const ability = await Ability.findByIdAndUpdate(req.params.id, req.body, { 
      new: true,
      runValidators: true 
    });
    if (!ability) {
      return res.status(404).json({ message: 'Ability not found' });
    }
    res.status(200).json(ability);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update ability', error: error.message });
  }
};

// 特性の削除
const deleteAbility = async (req, res) => {
  try {
    const ability = await Ability.findByIdAndDelete(req.params.id);
    if (!ability) {
      return res.status(404).json({ message: 'Ability not found' });
    }
    res.status(200).json({ message: 'Ability deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete ability', error: error.message });
  }
};

module.exports = {
  getAllAbilities,
  createAbility,
  updateAbility,
  deleteAbility
};
