// タイプ相性表
export const TYPE_CHART = {
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

/**
 * Get type effectiveness multiplier
 * Returns 1.0 for any combination not defined in TYPE_CHART
 */
function getTypeMultiplier(moveType: string, defenderType: string): number {
  // If move type doesn't exist in chart, default to 1.0
  if (!TYPE_CHART[moveType as keyof typeof TYPE_CHART]) return 1.0;
  
  // If defender type doesn't exist for this move type, default to 1.0
  const moveTypeChart = TYPE_CHART[moveType as keyof typeof TYPE_CHART];
  if (moveTypeChart[defenderType as keyof typeof moveTypeChart] === undefined) return 1.0;
  
  return moveTypeChart[defenderType as keyof typeof moveTypeChart] as number;
}

/**
 * Calculate type effectiveness for dual types
 * Multiplies effectiveness of both types
 */
export function calculateTypeEffectiveness(moveType: string, defenderTypes: string | string[]): number {
  // defenderTypesが配列でない場合は配列に変換（後方互換性）
  const types = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
  
  // 各タイプの相性倍率を乗算
  let totalMultiplier = 1.0;
  for (const defenderType of types) {
    totalMultiplier *= getTypeMultiplier(moveType, defenderType);
  }
  
  return totalMultiplier;
}

/**
 * Get effectiveness symbol for display
 * 〇: 1x, △: 0.5x, ◎: 2x
 */
export function getEffectivenessSymbol(effectiveness: number): string {
  if (effectiveness >= 2.0) return '◎'; // Super effective
  if (effectiveness <= 0.5) return '△'; // Not very effective
  return '〇'; // Normal effectiveness
}
