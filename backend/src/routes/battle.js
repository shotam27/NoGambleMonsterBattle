const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');

// Start a new battle
router.post('/start', battleController.startBattle);

// Select an action (move or switch)
router.post('/:battleId/action', battleController.selectAction);

// Switch active monster
router.post('/:battleId/switch', battleController.switchMonster);

// Regenerate opponent party for AI consecutive battles
router.post('/:battleId/regenerate-opponent', battleController.regenerateOpponentParty);

// Get battle status
router.get('/:battleId/status', battleController.getBattleStatus);

module.exports = router;
