const express = require('express');
const router = express.Router();
const abilityController = require('../controllers/abilityController');

// 全特性の取得
router.get('/', abilityController.getAllAbilities);

// 特性の作成
router.post('/', abilityController.createAbility);

// 特性の更新
router.put('/:id', abilityController.updateAbility);

// 特性の削除
router.delete('/:id', abilityController.deleteAbility);

module.exports = router;
