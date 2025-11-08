const { TYPE_CHART } = require('../config/constants');

/**
 * Get type effectiveness multiplier
 * Returns 1.0 for any combination not defined in TYPE_CHART
 */
function getTypeMultiplier(moveType, defenderType) {
  // If move type doesn't exist in chart, default to 1.0
  if (!TYPE_CHART[moveType]) return 1.0;
  
  // If defender type doesn't exist for this move type, default to 1.0
  if (TYPE_CHART[moveType][defenderType] === undefined) return 1.0;
  
  return TYPE_CHART[moveType][defenderType];
}

/**
 * Calculate type effectiveness for dual types
 * Multiplies effectiveness of both types
 */
function calculateTypeEffectiveness(moveType, defenderTypes) {
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
 * Calculate damage based on attack, defense, move power, and type effectiveness
 * Formula: attackStat * movePower * typeMultiplier / (1.5 * (defenseStat + 120))
 */
function calculateDamage(attacker, defender, move) {
  const movePower = move.power;
  
  // 物理技か特殊技かで使用するステータスを変更
  let attackPower, defense;
  if (move.category === 'physical') {
    attackPower = attacker.stats.attack;
    defense = defender.stats.defense;
  } else if (move.category === 'magical') {
    attackPower = attacker.stats.magicAttack;
    defense = defender.stats.magicDefense;
  } else {
    // デフォルトは物理
    attackPower = attacker.stats.attack;
    defense = defender.stats.defense;
  }
  
  // Get type multiplier (supports dual types, defaults to 1.0 for undefined combinations)
  const typeMultiplier = calculateTypeEffectiveness(move.type, defender.type);
  
  // STAB (Same Type Attack Bonus): 1.5x if move type matches any of attacker's types
  const attackerTypes = Array.isArray(attacker.type) ? attacker.type : [attacker.type];
  const stabBonus = attackerTypes.includes(move.type) ? 1.5 : 1.0;
  
  // New damage formula: (attackStat * movePower * typeMultiplier * stabBonus) / (1.5 * (defenseStat + 120))
  const damage = Math.max(1, Math.floor((attackPower * movePower * typeMultiplier * stabBonus) / (1.5 * (defense + 120))));
  
  return damage;
}

/**
 * Get speed for sorting (current active monster)
 * Accounts for paralysis status effect
 */
function getSpeed(side, battle) {
  const activeMember = side.party[side.activeIndex];
  const activeMonster = activeMember.monsterId;
  let speed = activeMonster.stats.speed;
  
  // Paralysis halves speed
  if (activeMember.status === 'paralysis') {
    speed = Math.floor(speed / 2);
  }
  
  return speed;
}

/**
 * Sort sides by speed (descending)
 */
function sortBySpeed(battle) {
  const sides = [
    { name: 'player', data: battle.player },
    { name: 'opponent', data: battle.opponent }
  ];
  
  return sides.sort((a, b) => getSpeed(b.data, battle) - getSpeed(a.data, battle));
}

/**
 * Process switch actions in speed order
 */
function processSwitches(battle) {
  const sortedSides = sortBySpeed(battle);
  
  for (const side of sortedSides) {
    const action = side.data.selectedAction;
    
    if (action?.type === 'switch') {
      // Perform switch
      const newIndex = action.switchToIndex;
      
      // Validate switch target
      if (newIndex >= 0 && newIndex < 3 && !side.data.party[newIndex].isFainted) {
        side.data.activeIndex = newIndex;
        // TODO: Trigger landing abilities if implemented
      }
    }
  }
}

/**
 * Process move damage and status effects
 */
function processDamage(battle, attacker, defender, move) {
  const attackerMonster = attacker.party[attacker.activeIndex].monsterId;
  const defenderMember = defender.party[defender.activeIndex];
  const defenderMonster = defenderMember.monsterId;
  
  let damage = 0;
  
  // Status moves don't deal damage but inflict status
  if (move.category === 'status' && move.statusEffect) {
    // Only apply if target doesn't already have a status
    if (defenderMember.status === 'none') {
      defenderMember.status = move.statusEffect;
      
      // Set sleep turns if applying sleep
      if (move.statusEffect === 'sleep') {
        defenderMember.sleepTurnsRemaining = 2;
      }
    }
  } else {
    // Regular damage move
    damage = calculateDamage(attackerMonster, defenderMonster, move);
    
    // Apply damage
    defenderMember.currentHp = Math.max(0, defenderMember.currentHp - damage);
  }
  
  return damage;
}

/**
 * Check for fainted monsters and handle forced switches
 */
function processFainting(battle) {
  const results = {
    playerFainted: false,
    opponentFainted: false,
    requiresPlayerSwitch: false,
    requiresOpponentSwitch: false
  };
  
  // Check player's active monster
  const playerActive = battle.player.party[battle.player.activeIndex];
  if (playerActive.currentHp <= 0 && !playerActive.isFainted) {
    playerActive.isFainted = true;
    results.playerFainted = true;
    
    // Check if all player monsters fainted
    const allPlayerFainted = battle.player.party.every(m => m.isFainted);
    if (allPlayerFainted) {
      battle.status = 'finished';
      battle.winner = 'opponent';
      return results;
    }
    
    results.requiresPlayerSwitch = true;
  }
  
  // Check opponent's active monster
  const opponentActive = battle.opponent.party[battle.opponent.activeIndex];
  if (opponentActive.currentHp <= 0 && !opponentActive.isFainted) {
    opponentActive.isFainted = true;
    results.opponentFainted = true;
    
    // Check if all opponent monsters fainted
    const allOpponentFainted = battle.opponent.party.every(m => m.isFainted);
    if (allOpponentFainted) {
      battle.status = 'finished';
      battle.winner = 'player';
      return results;
    }
    
    results.requiresOpponentSwitch = true;
    
    // AI auto-switch to next available monster
    const nextIndex = battle.opponent.party.findIndex(m => !m.isFainted);
    if (nextIndex !== -1) {
      battle.opponent.activeIndex = nextIndex;
      results.requiresOpponentSwitch = false; // AI already switched
    }
  }
  
  // If battle not finished and player requires switch, set status
  if (battle.status !== 'finished' && results.requiresPlayerSwitch) {
    battle.status = 'waiting_for_switch';
  }
  
  return results;
}

/**
 * Process moves in priority and speed order
 */
function processMoves(battle) {
  try {
    const battleLog = [];
    
    console.log('Processing moves...');
    
    // Determine which sides are using moves
    const moveSides = [];
    
    if (battle.player.selectedAction?.type === 'move') {
      const playerMonster = battle.player.party[battle.player.activeIndex].monsterId;
      console.log('Player monster:', playerMonster?.name, 'Moves:', playerMonster?.moves);
      const move = playerMonster.moves.find(m => m.id === battle.player.selectedAction.moveId);
      console.log('Player selected move:', battle.player.selectedAction.moveId, 'Found:', move);
      if (move) {
        moveSides.push({ 
          name: 'player', 
          side: battle.player, 
          opponent: battle.opponent,
          move, 
          speed: getSpeed(battle.player, battle),
          priority: move.priority || 0
        });
      }
    }
    
    if (battle.opponent.selectedAction?.type === 'move') {
      const opponentMonster = battle.opponent.party[battle.opponent.activeIndex].monsterId;
      console.log('Opponent monster:', opponentMonster?.name, 'Moves:', opponentMonster?.moves);
      const move = opponentMonster.moves.find(m => m.id === battle.opponent.selectedAction.moveId);
      console.log('Opponent selected move:', battle.opponent.selectedAction.moveId, 'Found:', move);
      if (move) {
        moveSides.push({ 
          name: 'opponent', 
          side: battle.opponent, 
          opponent: battle.player,
          move, 
          speed: getSpeed(battle.opponent, battle),
          priority: move.priority || 0
        });
      }
    }
    
    console.log('Move sides:', moveSides.length);
    
    // Sort by priority (descending), then by speed (descending)
    moveSides.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.speed - a.speed;
    });
    
    // Process each move
    for (const { name, side, opponent, move } of moveSides) {
      // Skip if attacker fainted or has 0 HP (fainted this turn)
      if (side.party[side.activeIndex].isFainted || side.party[side.activeIndex].currentHp <= 0) {
        continue;
      }
      
      // Check if attacker is asleep
      const attackerMember = side.party[side.activeIndex];
      if (attackerMember.status === 'sleep' && attackerMember.sleepTurnsRemaining > 0) {
        battleLog.push({
          message: `${attackerMember.monsterId.name}は眠っている！`
        });
        continue;
      }
      
      // Skip if defender already fainted (battle might have ended)
      if (opponent.party[opponent.activeIndex].isFainted || opponent.party[opponent.activeIndex].currentHp <= 0) {
        // Only skip if battle is already finished
        if (battle.status === 'finished') continue;
      }
      
      // TODO: Process pre-move abilities
      
      // Process damage or status effect
      const damage = processDamage(battle, side, opponent, move);
      
      // Add move to battle log
      if (move.category === 'status') {
        const defenderMember = opponent.party[opponent.activeIndex];
        const statusName = move.statusEffect === 'poison' ? '毒' : 
                          move.statusEffect === 'paralysis' ? '麻痺' : '眠り';
        battleLog.push({
          attacker: name,
          move: move.name,
          statusInflicted: statusName,
          targetStatus: defenderMember.status
        });
      } else {
        battleLog.push({
          attacker: name,
          move: move.name,
          damage
        });
      }
      
      // Update lastMove
      battle.lastMove = {
        attacker: name,
        moveId: move.id,
        damage
      };
      
      // TODO: Process move effects
      
      // Check for fainting
      const faintResult = processFainting(battle);
      
      if (faintResult.playerFainted) {
        battleLog.push({ message: `${battle.player.party[battle.player.activeIndex].monsterId.name}はひんしになった！` });
      }
      if (faintResult.opponentFainted) {
        battleLog.push({ message: `${battle.opponent.party[battle.opponent.activeIndex].monsterId.name}はひんしになった！` });
      }
      
      // If battle finished or requires switch, stop processing moves
      if (battle.status === 'finished' || battle.status === 'waiting_for_switch') {
        break;
      }
    }
    
    return battleLog;
  } catch (error) {
    console.error('Error in processMoves:', error);
    throw error;
  }
}

/**
 * Process status effects (poison, sleep countdown, etc.)
 */
function processStatusEffects(battle) {
  const battleLog = [];
  
  // Process player's active monster status
  const playerMember = battle.player.party[battle.player.activeIndex];
  if (!playerMember.isFainted && playerMember.currentHp > 0) {
    // Poison damage
    if (playerMember.status === 'poison') {
      const poisonDamage = Math.max(1, Math.floor(playerMember.maxHp / 8));
      playerMember.currentHp = Math.max(0, playerMember.currentHp - poisonDamage);
      battleLog.push({
        message: `${playerMember.monsterId.name}は毒のダメージを受けた！`,
        damage: poisonDamage
      });
      
      // Check if fainted from poison
      if (playerMember.currentHp <= 0) {
        const faintResult = processFainting(battle);
        if (faintResult.playerFainted) {
          battleLog.push({ message: `${playerMember.monsterId.name}はひんしになった！` });
        }
      }
    }
    
    // Decrease sleep turns
    if (playerMember.status === 'sleep' && playerMember.sleepTurnsRemaining > 0) {
      playerMember.sleepTurnsRemaining -= 1;
      if (playerMember.sleepTurnsRemaining <= 0) {
        playerMember.status = 'none';
        battleLog.push({
          message: `${playerMember.monsterId.name}は目を覚ました！`
        });
      }
    }
  }
  
  // Process opponent's active monster status
  const opponentMember = battle.opponent.party[battle.opponent.activeIndex];
  if (!opponentMember.isFainted && opponentMember.currentHp > 0) {
    // Poison damage
    if (opponentMember.status === 'poison') {
      const poisonDamage = Math.max(1, Math.floor(opponentMember.maxHp / 8));
      opponentMember.currentHp = Math.max(0, opponentMember.currentHp - poisonDamage);
      battleLog.push({
        message: `${opponentMember.monsterId.name}は毒のダメージを受けた！`,
        damage: poisonDamage
      });
      
      // Check if fainted from poison
      if (opponentMember.currentHp <= 0) {
        const faintResult = processFainting(battle);
        if (faintResult.opponentFainted) {
          battleLog.push({ message: `${opponentMember.monsterId.name}はひんしになった！` });
        }
      }
    }
    
    // Decrease sleep turns
    if (opponentMember.status === 'sleep' && opponentMember.sleepTurnsRemaining > 0) {
      opponentMember.sleepTurnsRemaining -= 1;
      if (opponentMember.sleepTurnsRemaining <= 0) {
        opponentMember.status = 'none';
        battleLog.push({
          message: `${opponentMember.monsterId.name}は目を覚ました！`
        });
      }
    }
  }
  
  return battleLog;
}

/**
 * Execute a full battle turn after both actions are selected
 */
async function executeTurn(battle) {
  try {
    const battleLog = [];
    
    console.log('Executing turn - Battle state:', {
      playerAction: battle.player.selectedAction,
      opponentAction: battle.opponent.selectedAction,
      playerActiveIndex: battle.player.activeIndex,
      opponentActiveIndex: battle.opponent.activeIndex
    });
    
    // Phase 1: Process switches (in speed order)
    processSwitches(battle);
    
    // Phase 2: Process moves (by priority, then speed)
    // Skip if battle requires switch (someone fainted during switches is unlikely, but check anyway)
    if (battle.status !== 'waiting_for_switch' && battle.status !== 'finished') {
      const moveLog = processMoves(battle);
      battleLog.push(...moveLog);
    }
    
    // Phase 3: Process status effects
    // Skip if battle requires switch or is finished
    if (battle.status !== 'waiting_for_switch' && battle.status !== 'finished') {
      const statusLog = processStatusEffects(battle);
      battleLog.push(...statusLog);
    }
    
    // Clear selected actions for next turn
    battle.player.selectedAction = { type: null };
    battle.opponent.selectedAction = { type: null };
    
    // Increment turn if battle continues and doesn't require switch
    if (battle.status === 'active') {
      battle.turn += 1;
      battle.status = 'waiting_for_actions';
    }
    
    await battle.save();
    
    return {
      battle,
      battleLog,
      requiresSwitch: battle.status === 'waiting_for_switch'
    };
  } catch (error) {
    console.error('Error in executeTurn:', error);
    throw error;
  }
}

/**
 * Select an action for a player
 */
async function selectAction(battle, playerSide, action) {
  const side = playerSide === 'player' ? battle.player : battle.opponent;
  
  if (action.type === 'move') {
    side.selectedAction = {
      type: 'move',
      moveId: action.moveId
    };
  } else if (action.type === 'switch') {
    side.selectedAction = {
      type: 'switch',
      switchToIndex: action.switchToIndex
    };
  }
  
  await battle.save();
  
  // Check if both sides have selected actions
  const bothReady = battle.player.selectedAction?.type && battle.opponent.selectedAction?.type;
  
  return {
    battle,
    bothReady,
    waitingForOpponent: !bothReady
  };
}

/**
 * AI selects an action for opponent
 */
async function selectAIAction(battle) {
  const opponentMonster = battle.opponent.party[battle.opponent.activeIndex].monsterId;
  
  // Simple AI: randomly select a move
  const randomMove = opponentMonster.moves[Math.floor(Math.random() * opponentMonster.moves.length)];
  
  battle.opponent.selectedAction = {
    type: 'move',
    moveId: randomMove.id
  };
  
  await battle.save();
  
  return battle;
}

module.exports = {
  executeTurn,
  selectAction,
  selectAIAction,
  processFainting
};
