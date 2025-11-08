// タイプ相性表
const TYPE_CHART = {
  fire: {
    fire: 1.0,
    water: 0.5,
    grass: 2.0
  },
  water: {
    fire: 2.0,
    water: 1.0,
    grass: 0.5
  },
  grass: {
    fire: 0.5,
    water: 2.0,
    grass: 1.0
  }
};

// 技の優先度
const MOVE_PRIORITIES = {
  HIGH: 5,
  NORMAL: 1
};

module.exports = {
  TYPE_CHART,
  MOVE_PRIORITIES
};
