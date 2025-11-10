const express = require('express');
const router = express.Router();
const monsterController = require('../controllers/monsterController');

// Get all monsters
router.get('/', monsterController.getAllMonsters);

// Get monster by ID
router.get('/:id', monsterController.getMonsterById);

// Create new monster (for admin/seeding)
router.post('/', monsterController.createMonster);

// Update monster
router.put('/:id', monsterController.updateMonster);

// Delete monster
router.delete('/:id', monsterController.deleteMonster);

module.exports = router;
