const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: true, errors: errors.array() });
  }
  next();
};

// Battle start validation
exports.validateBattleStart = [
  body('playerMonsterId').notEmpty().withMessage('Player monster ID is required'),
  body('opponentMonsterId').notEmpty().withMessage('Opponent monster ID is required'),
];

// Move validation
exports.validateMove = [
  body('moveId').notEmpty().withMessage('Move ID is required'),
];
