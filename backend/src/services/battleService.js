const { TYPE_CHART } = require('../config/constants');
const Monster = require('../models/Monster');

/**
 * Generate a random AI party with 3 monsters
 */
async function generateRandomAIParty() {
  // Get all available monsters
  const allMonsters = await Monster.find({});
  
  // Randomly select 3 monsters
  const shuffled = allMonsters.sort(() => 0.5 - Math.random());
  const selectedMonsters = shuffled.slice(0, 3);
  
  // Create party array
  return selectedMonsters.map(monster => ({
    monsterId: monster._id,
    currentHp: monster.stats.hp,
    maxHp: monster.stats.hp,
    isFainted: false,
    statModifiers: {
      attack: 0,
      defense: 0,
      magicAttack: 0,
      magicDefense: 0,
      speed: 0
    }
  }));
}

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
 * Apply stat modifiers to a stat value
 * +2: 2x, +1: 1.5x, 0: 1x, -1: 0.75x, -2: 0.5x
 */
function applyStatModifier(baseStat, modifier) {
  const multipliers = {
    '-2': 0.5,
    '-1': 0.75,
    '0': 1.0,
    '1': 1.5,
    '2': 2.0
  };
  return Math.floor(baseStat * (multipliers[modifier] || 1.0));
}

/**
 * Calculate damage based on attack, defense, move power, and type effectiveness
 * Formula: attackStat * movePower * typeMultiplier / (1.5 * (defenseStat + 120))
 */
function calculateDamage(attacker, defender, move, attackerMember, defenderMember) {
  const movePower = move.power;
  
  // 物理技か特殊技かで使用するステータスを変更
  let attackPower, defense;
  if (move.category === 'physical') {
    attackPower = applyStatModifier(attacker.stats.attack, attackerMember.statModifiers?.attack || 0);
    defense = applyStatModifier(defender.stats.defense, defenderMember.statModifiers?.defense || 0);
  } else if (move.category === 'magical') {
    attackPower = applyStatModifier(attacker.stats.magicAttack, attackerMember.statModifiers?.magicAttack || 0);
    defense = applyStatModifier(defender.stats.magicDefense, defenderMember.statModifiers?.magicDefense || 0);
  } else {
    // デフォルトは物理
    attackPower = applyStatModifier(attacker.stats.attack, attackerMember.statModifiers?.attack || 0);
    defense = applyStatModifier(defender.stats.defense, defenderMember.statModifiers?.defense || 0);
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
 * Accounts for paralysis status effect and speed modifiers
 */
function getSpeed(side, battle) {
  const activeMember = side.party[side.activeIndex];
  const activeMonster = activeMember.monsterId;
  let speed = applyStatModifier(activeMonster.stats.speed, activeMember.statModifiers?.speed || 0);
  
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
        // Clear substitute when switching out (substitute doesn't transfer)
        const switchedOutMember = side.data.party[side.data.activeIndex];
        if (switchedOutMember.hasSubstitute) {
          switchedOutMember.hasSubstitute = false;
          switchedOutMember.substituteHp = 0;
        }
        
        // Clear injection when switching out (injection is tied to active pokemon)
        if (switchedOutMember.hasInjection) {
          switchedOutMember.hasInjection = false;
        }
        
        // Clear protect flags when switching out
        switchedOutMember.usedProtectLastTurn = false;
        if (switchedOutMember.isProtecting) {
          switchedOutMember.isProtecting = false;
        }
        
        side.data.activeIndex = newIndex;
        
        // Reset stat modifiers when switching in
        const switchedInMember = side.data.party[newIndex];
        if (!switchedInMember.statModifiers) {
          switchedInMember.statModifiers = { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0 };
        } else {
          switchedInMember.statModifiers.attack = 0;
          switchedInMember.statModifiers.defense = 0;
          switchedInMember.statModifiers.magicAttack = 0;
          switchedInMember.statModifiers.magicDefense = 0;
          switchedInMember.statModifiers.speed = 0;
        }
        
        // Clear pendingSwitchAfterAttack flag if this was a switch-after-attack
        if (side.name === 'player') {
          battle.pendingSwitchAfterAttack.player = false;
        } else if (side.name === 'opponent') {
          battle.pendingSwitchAfterAttack.opponent = false;
        }
        
        // TODO: Trigger landing abilities if implemented
      }
    }
  }
}

/**
 * Process move damage and status effects
 */
function processDamage(battle, attacker, defender, move) {
  console.log('processDamage called with move:', JSON.stringify({
    name: move.name,
    category: move.category,
    hasStatChange: !!move.statChange,
    statChange: move.statChange
  }));
  
  const attackerMonster = attacker.party[attacker.activeIndex].monsterId;
  const defenderMember = defender.party[defender.activeIndex];
  const defenderMonster = defenderMember.monsterId;
  
  let damage = 0;
  
  // Check if defender is protecting
  if (defenderMember.isProtecting) {
    console.log('Defender is protecting, move blocked');
    defenderMember.isProtecting = false; // Reset protect flag after blocking
    return 0; // No damage or status effects applied
  }
  
  // Status moves don't deal damage but inflict status or stat changes
  if (move.category === 'status') {
    // Substitute blocks status effects and stat debuffs (but not self-buffs)
    if (defenderMember.hasSubstitute && move.statChange && move.statChange.target === 'opponent') {
      // Substitute blocks opponent-targeted stat changes
      return 0;
    }
    
    // Apply status effect (substitute blocks this too)
    if (move.statusEffect && defenderMember.status === 'none' && !defenderMember.hasSubstitute) {
      defenderMember.status = move.statusEffect;
      
      // Set sleep turns if applying sleep
      if (move.statusEffect === 'sleep') {
        defenderMember.sleepTurnsRemaining = 2;
      }
    }
    
    // Apply stat modifiers
    if (move.statChange) {
      const target = move.statChange.target === 'self' ? attacker.party[attacker.activeIndex] : defenderMember;
      const stat = move.statChange.stat;
      const stages = move.statChange.stages;
      
      console.log(`Applying stat change:`, {
        move: move.name,
        target: move.statChange.target,
        stat,
        stages,
        beforeStatModifiers: target.statModifiers
      });
      
      if (!target.statModifiers) {
        target.statModifiers = { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0 };
      }
      
      // Clamp to -2 to +2 range
      target.statModifiers[stat] = Math.max(-2, Math.min(2, (target.statModifiers[stat] || 0) + stages));
      
      console.log(`After stat change:`, {
        afterStatModifiers: target.statModifiers
      });
    }
  } else {
    // Regular damage move
    damage = calculateDamage(attackerMonster, defenderMonster, move, attacker.party[attacker.activeIndex], defenderMember);
    
    // Check if defender has substitute
    if (defenderMember.hasSubstitute) {
      // Moves with power < 70 are blocked completely
      if (move.power < 70) {
        // No damage to substitute or defender
        damage = 0;
      } else {
        // Power >= 70: break substitute, no damage to defender
        defenderMember.hasSubstitute = false;
        defenderMember.substituteHp = 0;
        damage = 0; // No damage to actual monster
      }
    } else {
      // No substitute: apply damage normally
      defenderMember.currentHp = Math.max(0, defenderMember.currentHp - damage);
    }
    
    // Apply status effect if move has statusEffect (substitute blocks this)
    if (move.statusEffect && defenderMember.status === 'none' && !defenderMember.hasSubstitute) {
      defenderMember.status = move.statusEffect;
      
      // Set sleep turns if applying sleep
      if (move.statusEffect === 'sleep') {
        defenderMember.sleepTurnsRemaining = 2;
      }
    }
    
    // Apply stat modifiers on damage moves (substitute blocks opponent-targeted debuffs)
    if (move.statChange) {
      const target = move.statChange.target === 'self' ? attacker.party[attacker.activeIndex] : defenderMember;
      const stat = move.statChange.stat;
      const stages = move.statChange.stages;
      
      // Substitute blocks opponent-targeted stat changes
      if (move.statChange.target === 'opponent' && defenderMember.hasSubstitute) {
        // Blocked by substitute
      } else {
        if (!target.statModifiers) {
          target.statModifiers = { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0 };
        }
        
        // Clamp to -2 to +2 range
        target.statModifiers[stat] = Math.max(-2, Math.min(2, (target.statModifiers[stat] || 0) + stages));
      }
    }
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
    
    // Clear all temporary battle effects when fainting
    playerActive.hasInjection = false;
    playerActive.hasSubstitute = false;
    playerActive.substituteHp = 0;
    playerActive.usedProtectLastTurn = false;
    if (playerActive.isProtecting) {
      playerActive.isProtecting = false;
    }
    
    // Clear pendingSwitchAfterAttack flag (fainting takes priority)
    battle.pendingSwitchAfterAttack.player = false;
    
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
  console.log('Checking opponent for fainting:', {
    activeIndex: battle.opponent.activeIndex,
    monsterName: opponentActive.monsterId?.name,
    currentHp: opponentActive.currentHp,
    isFainted: opponentActive.isFainted
  });
  
  if (opponentActive.currentHp <= 0 && !opponentActive.isFainted) {
    opponentActive.isFainted = true;
    results.opponentFainted = true;
    console.log('Opponent monster fainted:', {
      name: opponentActive.monsterId?.name,
      activeIndex: battle.opponent.activeIndex,
      isFainted: opponentActive.isFainted,
      currentHp: opponentActive.currentHp
    });
    
    // Clear all temporary battle effects when fainting
    opponentActive.hasInjection = false;
    opponentActive.hasSubstitute = false;
    opponentActive.substituteHp = 0;
    opponentActive.usedProtectLastTurn = false;
    if (opponentActive.isProtecting) {
      opponentActive.isProtecting = false;
    }
    
    // Clear pendingSwitchAfterAttack flag (fainting takes priority)
    battle.pendingSwitchAfterAttack.opponent = false;
    
    // Check if all opponent monsters fainted
    const allOpponentFainted = battle.opponent.party.every(m => m.isFainted);
    console.log('Checking if all opponent fainted:', {
      allOpponentFainted,
      isConsecutiveMode: battle.isConsecutiveMode,
      opponentParty: battle.opponent.party.map(m => ({ name: m.monsterId?.name, isFainted: m.isFainted }))
    });
    
    if (allOpponentFainted) {
      console.log('All opponent monsters fainted! isConsecutiveMode:', battle.isConsecutiveMode);
      
      // Check if this is AI consecutive battle mode
      if (battle.isConsecutiveMode) {
        console.log('AI consecutive mode detected! Incrementing win streak');
        // AI連戦モード: 相手を復活させて連勝カウントを増やす
        battle.winStreak = (battle.winStreak || 0) + 1;
        results.opponentTeamDefeated = true;
        results.winStreak = battle.winStreak;
        
        console.log('Returning opponentTeamDefeated result:', results);
        // Do not set battle as finished, will regenerate opponent party
        return results;
      } else {
        console.log('Normal battle mode - setting winner to player');
        // 通常バトル: プレイヤーの勝利
        battle.status = 'finished';
        battle.winner = 'player';
        return results;
      }
    }
    
    results.requiresOpponentSwitch = true;
    
    // For PvP battles (both have userId), both players must manually switch
    // For AI battles (opponent has no userId), AI auto-switches
    const isPvP = battle.player.userId && battle.opponent.userId;
    
    console.log('PvP check:', {
      isPvP,
      playerUserId: battle.player.userId,
      opponentUserId: battle.opponent.userId
    });
    
    if (!isPvP) {
      console.log('AI battle detected - auto-switching opponent');
      // AI auto-switch to next available monster
      const nextIndex = battle.opponent.party.findIndex(m => !m.isFainted);
      if (nextIndex !== -1) {
        // Clear effects on switched-out monster
        const switchedOutMember = battle.opponent.party[battle.opponent.activeIndex];
        if (switchedOutMember.hasSubstitute) {
          switchedOutMember.hasSubstitute = false;
          switchedOutMember.substituteHp = 0;
        }
        if (switchedOutMember.hasInjection) {
          switchedOutMember.hasInjection = false;
        }
        switchedOutMember.usedProtectLastTurn = false;
        if (switchedOutMember.isProtecting) {
          switchedOutMember.isProtecting = false;
        }
        
        battle.opponent.activeIndex = nextIndex;
        results.requiresOpponentSwitch = false; // AI already switched
        console.log('AI auto-switched to index:', nextIndex);
        
        // Reset stat modifiers when auto-switching in
        const switchedInMember = battle.opponent.party[nextIndex];
        if (!switchedInMember.statModifiers) {
          switchedInMember.statModifiers = { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0 };
        } else {
          switchedInMember.statModifiers.attack = 0;
          switchedInMember.statModifiers.defense = 0;
          switchedInMember.statModifiers.magicAttack = 0;
          switchedInMember.statModifiers.magicDefense = 0;
          switchedInMember.statModifiers.speed = 0;
        }
      }
    }
  }
  
  // If battle not finished and any player requires switch, set status
  console.log('Final fainting check:', {
    battleStatus: battle.status,
    requiresPlayerSwitch: results.requiresPlayerSwitch,
    requiresOpponentSwitch: results.requiresOpponentSwitch,
    willSetWaitingForSwitch: battle.status !== 'finished' && (results.requiresPlayerSwitch || results.requiresOpponentSwitch)
  });
  
  if (battle.status !== 'finished' && (results.requiresPlayerSwitch || results.requiresOpponentSwitch)) {
    battle.status = 'waiting_for_switch';
    console.log('Setting battle status to waiting_for_switch:', {
      requiresPlayerSwitch: results.requiresPlayerSwitch,
      requiresOpponentSwitch: results.requiresOpponentSwitch
    });
  }
  
  return results;
}

/**
 * Process moves in priority and speed order
 */
function processMoves(battle) {
  console.log('====== BATTLESERVICE.JS LOADED - NEW VERSION ======');
  try {
    const battleLog = [];
    
    console.log('Processing moves...');
    
    // Clear isProtecting flag for all monsters at the start of turn
    battle.player.party.forEach(member => {
      if (member.isProtecting) {
        member.isProtecting = false;
      }
    });
    battle.opponent.party.forEach(member => {
      if (member.isProtecting) {
        member.isProtecting = false;
      }
    });
    
    // Determine which sides are using moves
    const moveSides = [];
    
    if (battle.player.selectedAction?.type === 'move') {
      const playerMonster = battle.player.party[battle.player.activeIndex].monsterId;
      console.log('Player monster:', playerMonster?.name, 'Moves:', playerMonster?.moves);
      // Access custom 'id' field explicitly (not the default _id getter)
      const move = playerMonster.moves.find(m => (m._doc?.id || m.get?.('id') || m.id) === battle.player.selectedAction.moveId);
      console.log('Player selected move:', battle.player.selectedAction.moveId, 'Found:', move);
      if (move) {
        console.log('Converting move to plain object...');
        // Convert to plain object to ensure all nested properties are accessible
        let plainMove;
        try {
          plainMove = JSON.parse(JSON.stringify(move));
          console.log('Plain move object:', plainMove);
          console.log('Has statChange:', !!plainMove.statChange);
        } catch (e) {
          console.error('Error converting move:', e);
          plainMove = move;
        }
        moveSides.push({ 
          name: 'player', 
          side: battle.player, 
          opponent: battle.opponent,
          move: plainMove, 
          speed: getSpeed(battle.player, battle),
          priority: plainMove.priority || 0
        });
      }
    }
    
    if (battle.opponent.selectedAction?.type === 'move') {
      const opponentMonster = battle.opponent.party[battle.opponent.activeIndex].monsterId;
      console.log('Opponent monster:', opponentMonster?.name, 'Moves:', opponentMonster?.moves);
      // Access custom 'id' field explicitly (not the default _id getter)
      const move = opponentMonster.moves.find(m => (m._doc?.id || m.get?.('id') || m.id) === battle.opponent.selectedAction.moveId);
      console.log('Opponent selected move:', battle.opponent.selectedAction.moveId, 'Found:', move);
      if (move) {
        console.log('Converting opponent move to plain object...');
        // Convert to plain object to ensure all nested properties are accessible
        let plainMove;
        try {
          plainMove = JSON.parse(JSON.stringify(move));
          console.log('Plain opponent move object:', plainMove);
          console.log('Opponent has statChange:', !!plainMove.statChange);
        } catch (e) {
          console.error('Error converting opponent move:', e);
          plainMove = move;
        }
        moveSides.push({ 
          name: 'opponent', 
          side: battle.opponent, 
          opponent: battle.player,
          move: plainMove, 
          speed: getSpeed(battle.opponent, battle),
          priority: plainMove.priority || 0
        });
      }
    }
    
    console.log('Move sides:', moveSides.length);
    
    try {
      console.log('About to log move sides details...');
      const details = moveSides.map(ms => ({
        name: ms.name,
        move: ms.move.name,
        hasStatChange: !!ms.move.statChange,
        statChange: ms.move.statChange
      }));
      console.log('Move sides details:', details);
    } catch (mapError) {
      console.error('Error mapping move sides:', mapError);
    }
    
    // Sort by priority (descending), then by speed (descending)
    console.log('About to sort...');
    moveSides.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.speed - a.speed;
    });
    console.log('Sort complete');
    
    console.log('Starting to process moves...');
    
    // Process each move
    for (const { name, side, opponent, move } of moveSides) {
      console.log(`Processing move for ${name}:`, move.name);
      // Skip if attacker fainted or has 0 HP (fainted this turn)
      const attackerMember = side.party[side.activeIndex];
      console.log(`Checking ${name} attacker:`, {
        activeIndex: side.activeIndex,
        isFainted: attackerMember.isFainted,
        currentHp: attackerMember.currentHp,
        monsterName: attackerMember.monsterId?.name
      });
      
      if (attackerMember.isFainted || attackerMember.currentHp <= 0) {
        console.log(`${name}'s monster is fainted or has 0 HP, skipping turn`);
        continue;
      }
      
      // Check if attacker is asleep
      if (attackerMember.status === 'sleep' && attackerMember.sleepTurnsRemaining > 0) {
        battleLog.push({
          message: `${attackerMember.monsterId.name}は眠っている！`
        });
        continue;
      }
      
      // Handle protect move
      if (move.isProtect) {
        // Cannot use protect consecutively
        if (attackerMember.usedProtectLastTurn) {
          battleLog.push({
            message: `${attackerMember.monsterId.name}の${move.name}は失敗した！`,
            attacker: attackerMember.monsterId.name,
            move: move.name
          });
          attackerMember.usedProtectLastTurn = false; // Reset after failed attempt
          continue;
        }
        
        // Set protect flag for this turn
        attackerMember.isProtecting = true;
        attackerMember.usedProtectLastTurn = true;
        
        battleLog.push({
          message: `${attackerMember.monsterId.name}はまもる状態になった！`,
          attacker: attackerMember.monsterId.name,
          move: move.name
        });
        continue;
      } else {
        // Not using protect this turn, reset the flag
        attackerMember.usedProtectLastTurn = false;
      }
      
      // Handle heal move
      if (move.healsUser) {
        const healAmount = Math.floor(attackerMember.maxHp * move.healPercentage / 100);
        const previousHp = attackerMember.currentHp;
        attackerMember.currentHp = Math.min(attackerMember.maxHp, attackerMember.currentHp + healAmount);
        const actualHeal = attackerMember.currentHp - previousHp;
        
        battleLog.push({
          message: `${attackerMember.monsterId.name}はHPを${actualHeal}回復した！`,
          attacker: attackerMember.monsterId.name,
          move: move.name
        });
        continue;
      }
      
      // Handle substitute move
      if (move.createsSubstitute) {
        // Cannot create substitute if already has one
        if (attackerMember.hasSubstitute) {
          battleLog.push({
            message: `${attackerMember.monsterId.name}の${move.name}は失敗した！（すでに分身がいる）`,
            attacker: attackerMember.monsterId.name,
            move: move.name
          });
          continue;
        }
        
        // Need at least 1/4 HP to create substitute
        const substituteCost = Math.floor(attackerMember.maxHp / 4);
        if (attackerMember.currentHp <= substituteCost) {
          battleLog.push({
            message: `${attackerMember.monsterId.name}の${move.name}は失敗した！（HPが足りない）`,
            attacker: attackerMember.monsterId.name,
            move: move.name
          });
          continue;
        }
        
        // Create substitute
        attackerMember.currentHp -= substituteCost;
        attackerMember.hasSubstitute = true;
        attackerMember.substituteHp = substituteCost;
        
        battleLog.push({
          message: `${attackerMember.monsterId.name}は分身を作った！`,
          attacker: attackerMember.monsterId.name,
          move: move.name
        });
        continue;
      }
      
      // Handle injection move (like Leech Seed)
      if (move.causesInjection) {
        const defenderMember = opponent.party[opponent.activeIndex];
        
        // Cannot inject if already injected
        if (defenderMember.hasInjection) {
          battleLog.push({
            message: `${attackerMember.monsterId.name}の${move.name}は失敗した！（すでに効果がかかっている）`,
            attacker: attackerMember.monsterId.name,
            move: move.name
          });
          continue;
        }
        
        // Apply injection
        defenderMember.hasInjection = true;
        
        battleLog.push({
          message: `${defenderMember.monsterId.name}は注射された！`,
          attacker: attackerMember.monsterId.name,
          move: move.name
        });
        continue;
      }
      
      // Skip if defender already fainted (battle might have ended)
      let defenderMember = opponent.party[opponent.activeIndex];
      if (defenderMember.isFainted || defenderMember.currentHp <= 0) {
        // Only skip if battle is already finished
        if (battle.status === 'finished') {
          console.log(`Battle already finished, skipping`);
          continue;
        }
      }
      
      // Skip if defender has pending switchAfterAttack (already switching out)
      const defenderHasPendingSwitch = (name === 'player' && battle.pendingSwitchAfterAttack.opponent) ||
                                       (name === 'opponent' && battle.pendingSwitchAfterAttack.player);
      if (defenderHasPendingSwitch) {
        battleLog.push({
          message: `${defenderMember.monsterId.name}は既に引っ込んでいる！`
        });
        continue;
      }
      
      // TODO: Process pre-move abilities
      
      // Store defender's substitute state before damage
      const hadSubstitute = defenderMember.hasSubstitute;
      const wasProtecting = defenderMember.isProtecting;
      
      // Process damage or status effect
      const damage = processDamage(battle, side, opponent, move);
      
      // Check if move was blocked by protect
      if (wasProtecting && damage === 0) {
        battleLog.push({
          message: `${defenderMember.monsterId.name}はまもるで攻撃を防いだ！`
        });
        continue; // Skip all subsequent effects
      }
      
      // Check if substitute was broken
      const substituteBroken = hadSubstitute && !defenderMember.hasSubstitute;
      
      console.log(`After processDamage for ${move.name}:`, {
        attackerStatModifiers: side.party[side.activeIndex].statModifiers,
        defenderStatModifiers: opponent.party[opponent.activeIndex].statModifiers,
        hadSubstitute,
        substituteBroken
      });
      
      // Add move to battle log
      if (move.category === 'status') {
        const statusName = move.statusEffect === 'poison' ? '毒' : 
                          move.statusEffect === 'paralysis' ? '麻痺' : '眠り';
        battleLog.push({
          attacker: attackerMember.monsterId.name,
          move: move.name,
          statusInflicted: statusName,
          targetStatus: defenderMember.status
        });
      } else {
        const logEntry = {
          attacker: attackerMember.monsterId.name,
          move: move.name,
          damage
        };
        
        // Add substitute info to log
        if (hadSubstitute && move.power < 70) {
          logEntry.substituteBlocked = true;
        } else if (substituteBroken) {
          logEntry.substituteBroken = true;
        }
        
        battleLog.push(logEntry);
        
        // Add message for substitute interaction
        if (hadSubstitute && move.power < 70) {
          battleLog.push({
            message: `${defenderMember.monsterId.name}の分身が攻撃を防いだ！`
          });
        } else if (substituteBroken) {
          battleLog.push({
            message: `${defenderMember.monsterId.name}の分身が壊れた！`
          });
        }
      }
      
      // Update lastMove
      battle.lastMove = {
        attacker: attackerMember.monsterId.name,
        moveId: move.id,
        damage
      };
      
      // Process switch after attack if move has switchAfterAttack flag
      console.log(`Checking switchAfterAttack for ${name}:`, {
        hasSwitchAfterAttack: move.switchAfterAttack,
        isFainted: attackerMember.isFainted,
        currentHp: attackerMember.currentHp
      });
      
      if (move.switchAfterAttack && !attackerMember.isFainted && attackerMember.currentHp > 0) {
        // Find available non-fainted party members to switch to
        const availableMembers = side.party
          .filter((member, index) => 
            index !== side.activeIndex && 
            !member.isFainted && 
            member.currentHp > 0
          );
        
        console.log(`${name} has ${availableMembers.length} available members to switch`);
        
        if (availableMembers.length > 0) {
          // Mark that this side needs to switch after attack
          if (name === 'player') {
            battle.pendingSwitchAfterAttack.player = true;
          } else {
            battle.pendingSwitchAfterAttack.opponent = true;
          }
          
          console.log(`Set pendingSwitchAfterAttack for ${name}`, {
            player: battle.pendingSwitchAfterAttack.player,
            opponent: battle.pendingSwitchAfterAttack.opponent
          });
          
          battleLog.push({
            message: `${attackerMember.monsterId.name}は戻る準備をしている！`
          });
        }
      }
      
      // TODO: Process move effects
    }
    
    // Check for fainting AFTER all moves are processed
    // Store names before processing fainting (in case of auto-switch)
    const playerActiveName = battle.player.party[battle.player.activeIndex].monsterId.name;
    const opponentActiveName = battle.opponent.party[battle.opponent.activeIndex].monsterId.name;
    
    const faintResult = processFainting(battle);
    
    if (faintResult.playerFainted) {
      battleLog.push({ message: `${playerActiveName}はひんしになった！` });
    }
    if (faintResult.opponentFainted) {
      battleLog.push({ message: `${opponentActiveName}はひんしになった！` });
    }
    
    return {
      battleLog,
      faintResult
    };
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
    
    // Injection damage (drain HP and heal opponent)
    if (playerMember.hasInjection) {
      const injectionDamage = Math.max(1, Math.floor(playerMember.maxHp / 8));
      playerMember.currentHp = Math.max(0, playerMember.currentHp - injectionDamage);
      
      // Heal the opponent
      const opponentMember = battle.opponent.party[battle.opponent.activeIndex];
      if (!opponentMember.isFainted) {
        const healAmount = injectionDamage;
        opponentMember.currentHp = Math.min(opponentMember.maxHp, opponentMember.currentHp + healAmount);
        battleLog.push({
          message: `${playerMember.monsterId.name}の体力が吸い取られた！`,
          damage: injectionDamage
        });
        battleLog.push({
          message: `${opponentMember.monsterId.name}は体力を回復した！`,
          heal: healAmount
        });
      } else {
        // Opponent fainted, so just take damage without healing
        battleLog.push({
          message: `${playerMember.monsterId.name}の体力が吸い取られた！`,
          damage: injectionDamage
        });
      }
      
      // Check if fainted from injection
      if (playerMember.currentHp <= 0) {
        const faintResult = processFainting(battle);
        if (faintResult.playerFainted) {
          battleLog.push({ message: `${playerMember.monsterId.name}はひんしになった！` });
        }
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
    
    // Injection damage (drain HP and heal player)
    if (opponentMember.hasInjection) {
      const injectionDamage = Math.max(1, Math.floor(opponentMember.maxHp / 8));
      opponentMember.currentHp = Math.max(0, opponentMember.currentHp - injectionDamage);
      
      // Heal the player
      const playerMember = battle.player.party[battle.player.activeIndex];
      if (!playerMember.isFainted) {
        const healAmount = injectionDamage;
        playerMember.currentHp = Math.min(playerMember.maxHp, playerMember.currentHp + healAmount);
        battleLog.push({
          message: `${opponentMember.monsterId.name}の体力が吸い取られた！`,
          damage: injectionDamage
        });
        battleLog.push({
          message: `${playerMember.monsterId.name}は体力を回復した！`,
          heal: healAmount
        });
      } else {
        // Player fainted, so just take damage without healing
        battleLog.push({
          message: `${opponentMember.monsterId.name}の体力が吸い取られた！`,
          damage: injectionDamage
        });
      }
      
      // Check if fainted from injection
      if (opponentMember.currentHp <= 0) {
        const faintResult = processFainting(battle);
        if (faintResult.opponentFainted) {
          battleLog.push({ message: `${opponentMember.monsterId.name}はひんしになった！` });
        }
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
    
    // Add turn start log
    battleLog.push(`===== ${battle.turn}ターン目開始 =====`);
    
    console.log('Executing turn - Battle state:', {
      playerAction: battle.player.selectedAction,
      opponentAction: battle.opponent.selectedAction,
      playerActiveIndex: battle.player.activeIndex,
      opponentActiveIndex: battle.opponent.activeIndex,
      playerActiveMonster: battle.player.party[battle.player.activeIndex].monsterId?.name,
      opponentActiveMonster: battle.opponent.party[battle.opponent.activeIndex].monsterId?.name,
      playerActiveHP: battle.player.party[battle.player.activeIndex].currentHp,
      opponentActiveHP: battle.opponent.party[battle.opponent.activeIndex].currentHp
    });
    
    console.log('All party members HP:', {
      player: battle.player.party.map((m, i) => ({
        index: i,
        name: m.monsterId?.name,
        hp: m.currentHp,
        isFainted: m.isFainted
      })),
      opponent: battle.opponent.party.map((m, i) => ({
        index: i,
        name: m.monsterId?.name,
        hp: m.currentHp,
        isFainted: m.isFainted
      }))
    });
    
    // Phase 1: Process switches (in speed order)
    processSwitches(battle);
    
    // After processing switches, check if waiting_for_switch should be cleared
    if (battle.status === 'waiting_for_switch') {
      // Check if all required switches are complete
      const playerNeedsSwitch = battle.player.party[battle.player.activeIndex]?.isFainted || battle.pendingSwitchAfterAttack.player;
      const opponentNeedsSwitch = battle.opponent.party[battle.opponent.activeIndex]?.isFainted || battle.pendingSwitchAfterAttack.opponent;
      
      // If no one needs to switch anymore, return to active status
      if (!playerNeedsSwitch && !opponentNeedsSwitch) {
        battle.status = 'active';
        console.log('Switches complete, returning to active status');
      }
    }
    
    // Phase 2: Process moves (by priority, then speed)
    // Skip if battle requires switch (someone fainted during switches is unlikely, but check anyway)
    let faintingResults = null;
    if (battle.status !== 'waiting_for_switch' && battle.status !== 'finished') {
      const moveResult = processMoves(battle);
      battleLog.push(...moveResult.battleLog);
      faintingResults = moveResult.faintResult;
      console.log('Fainting check results:', faintingResults);
    }
    
    // Phase 3: Process status effects
    // Skip if battle requires switch or is finished
    if (battle.status !== 'waiting_for_switch' && battle.status !== 'finished') {
      const statusLog = processStatusEffects(battle);
      battleLog.push(...statusLog);
    }
    
    // Check if any side has pending switch after attack (only if no fainting occurred)
    console.log('Checking pendingSwitchAfterAttack:', {
      battleStatus: battle.status,
      player: battle.pendingSwitchAfterAttack.player,
      opponent: battle.pendingSwitchAfterAttack.opponent
    });
    
    if (battle.status === 'active' || battle.status === 'waiting_for_actions') {
      if (battle.pendingSwitchAfterAttack.player || battle.pendingSwitchAfterAttack.opponent) {
        battle.status = 'waiting_for_switch';
        console.log('Battle requires switch after attack:', {
          player: battle.pendingSwitchAfterAttack.player,
          opponent: battle.pendingSwitchAfterAttack.opponent
        });
      }
    }
    
    // Clear selected actions for next turn
    battle.player.selectedAction = { type: null };
    battle.opponent.selectedAction = { type: null };
    
    // Add turn end log before incrementing turn
    if (battle.status === 'active') {
      battleLog.push(`===== ${battle.turn}ターン目終了 =====`);
    }
    
    // Increment turn if battle continues and doesn't require switch
    if (battle.status === 'active') {
      battle.turn += 1;
      battle.status = 'waiting_for_actions';
    }
    
    await battle.save();
    
    return {
      battle,
      battleLog,
      opponentTeamDefeated: faintingResults?.opponentTeamDefeated || false,
      winStreak: faintingResults?.winStreak || battle.winStreak || 0,
      requiresSwitch: battle.status === 'waiting_for_switch' ? {
        player: battle.pendingSwitchAfterAttack.player,
        opponent: battle.pendingSwitchAfterAttack.opponent
      } : null
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
  // Check if AI needs to switch after attack (check pendingSwitchAfterAttack flag regardless of status)
  if (battle.pendingSwitchAfterAttack?.opponent) {
    // Find first non-fainted monster that isn't currently active
    const availableIndices = battle.opponent.party
      .map((member, idx) => ({ idx, member }))
      .filter(({ idx, member }) => !member.isFainted && idx !== battle.opponent.activeIndex)
      .map(({ idx }) => idx);
    
    if (availableIndices.length > 0) {
      // Randomly select one of the available monsters
      const switchToIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      
      battle.opponent.selectedAction = {
        type: 'switch',
        switchToIndex
      };
      
      await battle.save();
      return battle;
    }
  }
  
  // Normal move selection
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
  processFainting,
  generateRandomAIParty
};
