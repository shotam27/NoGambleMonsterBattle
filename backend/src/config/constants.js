// タイプ相性表
const TYPE_CHART = {
  normal: {
  },
  fire: {
    water: 0.5,
    grass: 2.0
  },
  water: {
    fire: 2.0,
    grass: 0.5
  },
  grass: {
    fire: 0.5,
    water: 2.0,
  },
  light: {
    dark: 2.0
  },
  dark: {
    light: 2.0
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
