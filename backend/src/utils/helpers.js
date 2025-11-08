// Helper functions

// Calculate type effectiveness
exports.getTypeMultiplier = (attackType, defenseType, typeChart) => {
  return typeChart[attackType]?.[defenseType] || 1.0;
};

// Sort by speed
exports.sortBySpeed = (monsters) => {
  return monsters.sort((a, b) => b.stats.speed - a.stats.speed);
};
