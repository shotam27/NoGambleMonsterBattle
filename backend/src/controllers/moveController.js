const Move = require('../models/Move');

// 全技の取得
const getAllMoves = async (req, res) => {
  try {
    const moves = await Move.find().sort({ id: 1 });
    res.status(200).json(moves);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch moves', error: error.message });
  }
};

// 技の作成
const createMove = async (req, res) => {
  try {
    const move = new Move(req.body);
    await move.save();
    res.status(201).json(move);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create move', error: error.message });
  }
};

// 技の更新
const updateMove = async (req, res) => {
  try {
    const move = await Move.findByIdAndUpdate(req.params.id, req.body, { 
      new: true,
      runValidators: true 
    });
    if (!move) {
      return res.status(404).json({ message: 'Move not found' });
    }
    res.status(200).json(move);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update move', error: error.message });
  }
};

// 技の削除
const deleteMove = async (req, res) => {
  try {
    const move = await Move.findByIdAndDelete(req.params.id);
    if (!move) {
      return res.status(404).json({ message: 'Move not found' });
    }
    res.status(200).json({ message: 'Move deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete move', error: error.message });
  }
};

module.exports = {
  getAllMoves,
  createMove,
  updateMove,
  deleteMove
};
