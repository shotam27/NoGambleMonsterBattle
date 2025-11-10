const express = require('express');
const router = express.Router();
const { getAllMoves, createMove, updateMove, deleteMove } = require('../controllers/moveController');

router.get('/', getAllMoves);
router.post('/', createMove);
router.put('/:id', updateMove);
router.delete('/:id', deleteMove);

module.exports = router;
