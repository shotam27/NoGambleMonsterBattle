const Battle = require('../models/Battle');
const Monster = require('../models/Monster');
const battleService = require('../services/battleService');

// Start a new battle
exports.startBattle = async (req, res) => {
  console.log('====== BATTLECONTROLLER.JS - NEW VERSION LOADED ======');
  try {
    const { playerMonsterIds, opponentMonsterIds, isConsecutiveMode } = req.body;

    // Validate input
    if (!playerMonsterIds || !opponentMonsterIds || 
        playerMonsterIds.length !== 3 || opponentMonsterIds.length !== 3) {
      return res.status(400).json({ error: true, message: 'Must select exactly 3 monsters for each player' });
    }

    // Get monster data
    const playerMonsters = await Monster.find({ _id: { $in: playerMonsterIds } });
    const opponentMonsters = await Monster.find({ _id: { $in: opponentMonsterIds } });

    if (playerMonsters.length !== 3 || opponentMonsters.length !== 3) {
      return res.status(404).json({ error: true, message: 'Some monsters not found' });
    }

    // Create party arrays
    const playerParty = playerMonsterIds.map(id => {
      const monster = playerMonsters.find(m => m._id.toString() === id);
      return {
        monsterId: id,
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
      };
    });

    const opponentParty = opponentMonsterIds.map(id => {
      const monster = opponentMonsters.find(m => m._id.toString() === id);
      return {
        monsterId: id,
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
      };
    });

    // Create battle session
    const battle = new Battle({
      player: {
        party: playerParty,
        activeIndex: 0,
        selectedAction: { type: null }
      },
      opponent: {
        party: opponentParty,
        activeIndex: 0,
        selectedAction: { type: null }
      },
      status: 'waiting_for_actions',
      isConsecutiveMode: isConsecutiveMode || false
    });

    await battle.save();

    // Populate for response
    await battle.populate([
      { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
      { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
    ]);

    // Activate abilities for both active monsters at battle start
    const initialAbilityLog = [];
    const playerMonster = battle.player.party[battle.player.activeIndex].monsterId;
    const opponentMonster = battle.opponent.party[battle.opponent.activeIndex].monsterId;
    
    // Process player's ability
    if (playerMonster && playerMonster.ability) {
      const ability = playerMonster.ability;
      const activeMember = battle.player.party[battle.player.activeIndex];
      
      if (ability.effectType === 'statChange') {
        const statChange = ability.statChange;
        const targetMember = statChange.targetSide === 'self' ? activeMember : battle.opponent.party[battle.opponent.activeIndex];
        
        const stat = statChange.stat;
        const stages = statChange.stages;
        targetMember.statModifiers[stat] = Math.max(-2, Math.min(2, (targetMember.statModifiers[stat] || 0) + stages));
        
        const targetName = statChange.targetSide === 'self' ? playerMonster.name : opponentMonster.name;
        const statLabels = { attack: '攻撃', defense: '防御', magicAttack: '魔法攻撃', magicDefense: '魔法防御', speed: '素早さ' };
        const stageLabel = stages > 0 ? `${stages}段階上がった` : `${Math.abs(stages)}段階下がった`;
        initialAbilityLog.push(`${playerMonster.name}の${ability.name}が発動! ${targetName}の${statLabels[stat]}が${stageLabel}!`);
      } else if (ability.effectType === 'heal') {
        const healAmount = Math.floor(activeMember.maxHp * ability.healPercentage / 100);
        const previousHp = activeMember.currentHp;
        activeMember.currentHp = Math.min(activeMember.maxHp, activeMember.currentHp + healAmount);
        const actualHeal = activeMember.currentHp - previousHp;
        
        if (actualHeal > 0) {
          initialAbilityLog.push(`${playerMonster.name}の${ability.name}が発動! HPを${actualHeal}回復した!`);
        }
      }
    }
    
    // Process opponent's ability
    if (opponentMonster && opponentMonster.ability) {
      const ability = opponentMonster.ability;
      const activeMember = battle.opponent.party[battle.opponent.activeIndex];
      
      if (ability.effectType === 'statChange') {
        const statChange = ability.statChange;
        const targetMember = statChange.targetSide === 'self' ? activeMember : battle.player.party[battle.player.activeIndex];
        
        const stat = statChange.stat;
        const stages = statChange.stages;
        targetMember.statModifiers[stat] = Math.max(-2, Math.min(2, (targetMember.statModifiers[stat] || 0) + stages));
        
        const targetName = statChange.targetSide === 'self' ? opponentMonster.name : playerMonster.name;
        const statLabels = { attack: '攻撃', defense: '防御', magicAttack: '魔法攻撃', magicDefense: '魔法防御', speed: '素早さ' };
        const stageLabel = stages > 0 ? `${stages}段階上がった` : `${Math.abs(stages)}段階下がった`;
        initialAbilityLog.push(`${opponentMonster.name}の${ability.name}が発動! ${targetName}の${statLabels[stat]}が${stageLabel}!`);
      } else if (ability.effectType === 'heal') {
        const healAmount = Math.floor(activeMember.maxHp * ability.healPercentage / 100);
        const previousHp = activeMember.currentHp;
        activeMember.currentHp = Math.min(activeMember.maxHp, activeMember.currentHp + healAmount);
        const actualHeal = activeMember.currentHp - previousHp;
        
        if (actualHeal > 0) {
          initialAbilityLog.push(`${opponentMonster.name}の${ability.name}が発動! HPを${actualHeal}回復した!`);
        }
      }
    }
    
    // Add ability activation logs to battle log and save
    if (initialAbilityLog.length > 0) {
      battle.battleLog.push(...initialAbilityLog);
      await battle.save();
    }

    const battleObj = battle.toObject();
    console.log('Sending battle data:', JSON.stringify({
      firstPlayerMember: battleObj.player.party[0],
      hasStatModifiers: !!battleObj.player.party[0].statModifiers
    }, null, 2));

    res.status(201).json({
      battleId: battle._id,
      battle: battleObj
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

// Select an action (move or switch)
exports.selectAction = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { actionType, moveId, switchToIndex } = req.body;

    const battle = await Battle.findById(battleId).populate([
      { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
      { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
    ]);
    
    if (!battle) {
      return res.status(404).json({ error: true, message: 'Battle not found' });
    }

    if (battle.status === 'finished') {
      return res.status(403).json({ error: true, message: 'Battle already finished' });
    }

    if (battle.status !== 'waiting_for_actions' && battle.status !== 'waiting_for_switch') {
      return res.status(403).json({ error: true, message: 'Not waiting for actions' });
    }

    // Build action object
    const action = { type: actionType };
    if (actionType === 'move') {
      action.moveId = moveId;
    } else if (actionType === 'switch') {
      action.switchToIndex = switchToIndex;
    }

    // Select player action
    const result = await battleService.selectAction(battle, 'player', action);

    // If AI hasn't selected yet, make AI select
    if (!result.battle.opponent.selectedAction?.type) {
      await battleService.selectAIAction(result.battle);
    }

    // Check if both ready
    const bothReady = result.battle.player.selectedAction?.type && result.battle.opponent.selectedAction?.type;

    // If both ready, execute turn
    if (bothReady) {
      const turnResult = await battleService.executeTurn(result.battle);
      
      // Re-populate after save
      await turnResult.battle.populate([
        { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
        { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
      ]);

      const battleObj = turnResult.battle.toObject();
      console.log('After turn - Player statModifiers:', battleObj.player.party[0].statModifiers);

      // If someone needs to switch after attack, handle it
      // Check both 'waiting_for_switch' and if pendingSwitchAfterAttack is set
      const needsSwitchAfterAttack = turnResult.requiresSwitch?.player || turnResult.requiresSwitch?.opponent;
      
      // If no switch needed and AI doesn't have next action, make it select
      if (!needsSwitchAfterAttack && !turnResult.battle.opponent.selectedAction?.type) {
        await battleService.selectAIAction(turnResult.battle);
        console.log('AI selected action for next turn (normal case)');
        
        // Re-populate after AI selection
        await turnResult.battle.populate([
          { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
          { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
        ]);
      }
      
      if (needsSwitchAfterAttack) {
        console.log('Detected switch after attack needed:', turnResult.requiresSwitch);
        
        // If opponent (AI) needs to switch, auto-select for AI
        if (turnResult.requiresSwitch?.opponent) {
          // First, let AI select switch action (while pendingSwitchAfterAttack is still true)
          await battleService.selectAIAction(turnResult.battle);
          console.log('AI auto-selected switch after attack move');
          
          // Then clear the pending switch for opponent and reset status to active
          turnResult.battle.pendingSwitchAfterAttack.opponent = false;
          turnResult.battle.status = 'active';
          await turnResult.battle.save();
          
          // Re-populate after AI selection
          await turnResult.battle.populate([
            { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
            { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
          ]);
          
          // Check if both have now selected actions
          const bothHaveActions = 
            turnResult.battle.player.selectedAction?.type && 
            turnResult.battle.opponent.selectedAction?.type;
          
          if (bothHaveActions) {
            // Execute the switch turn immediately
            const switchTurnResult = await battleService.executeTurn(turnResult.battle);
            
            // After executing switch, AI needs to select action for next turn
            if (!switchTurnResult.battle.opponent.selectedAction?.type) {
              await battleService.selectAIAction(switchTurnResult.battle);
              console.log('AI selected action for next turn after switch');
            }
            
            // Re-populate
            await switchTurnResult.battle.populate([
              { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
              { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
            ]);
            
            return res.status(200).json({
              battle: switchTurnResult.battle.toObject(),
              battleLog: [...turnResult.battleLog, ...switchTurnResult.battleLog],
              opponentTeamDefeated: turnResult.opponentTeamDefeated || switchTurnResult.opponentTeamDefeated,
              winStreak: turnResult.winStreak || switchTurnResult.winStreak,
              requiresSwitch: switchTurnResult.requiresSwitch,
              message: 'Turn and switch executed'
            });
          } else {
            // AI selected switch, but player hasn't selected action yet
            // For AI battles, execute the switch turn immediately (player doesn't need to select)
            const isAIBattle = !turnResult.battle.player.userId && !turnResult.battle.opponent.userId;
            
            if (isAIBattle) {
              // Execute the switch turn (only opponent switches, player does nothing)
              const switchTurnResult = await battleService.executeTurn(turnResult.battle);
              console.log('Executed switch turn in AI battle');
              
              // After switch completes, select next actions for both sides
              if (!switchTurnResult.battle.opponent.selectedAction?.type) {
                await battleService.selectAIAction(switchTurnResult.battle);
                console.log('AI selected action for next turn after switch (AI battle)');
              }
              
              if (!switchTurnResult.battle.player.selectedAction?.type) {
                await battleService.selectAIAction(switchTurnResult.battle, 'player');
                console.log('Player AI selected action for next turn after switch (AI battle)');
              }
              
              // Re-populate
              await switchTurnResult.battle.populate([
                { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
                { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
              ]);
              
              return res.status(200).json({
                battle: switchTurnResult.battle.toObject(),
                battleLog: [...turnResult.battleLog, ...switchTurnResult.battleLog],
                opponentTeamDefeated: turnResult.opponentTeamDefeated || switchTurnResult.opponentTeamDefeated,
                winStreak: turnResult.winStreak || switchTurnResult.winStreak,
                requiresSwitch: switchTurnResult.requiresSwitch,
                message: 'Turn and switch executed (AI battle)'
              });
            }
            
            // PvP battle - wait for player to select their action
            // Re-populate
            await turnResult.battle.populate([
              { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
              { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
            ]);
            
            console.log('AI selected switch, waiting for player action');
            
            // Return and wait for player to select their next action
            return res.status(200).json({
              battle: turnResult.battle.toObject(),
              battleLog: turnResult.battleLog,
              opponentTeamDefeated: turnResult.opponentTeamDefeated,
              winStreak: turnResult.winStreak,
              requiresSwitch: turnResult.requiresSwitch,
              message: 'AI switched, waiting for player action'
            });
          }
        }
        
        // If player needs to switch, return and wait for player selection
        if (turnResult.requiresSwitch?.player) {
          console.log('Player needs to select switch after attack move');
          // Don't auto-execute turn yet, wait for player to select switch
          await turnResult.battle.populate([
            { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
            { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
          ]);
          
          return res.status(200).json({
            battle: turnResult.battle.toObject(),
            battleLog: turnResult.battleLog,
            opponentTeamDefeated: turnResult.opponentTeamDefeated,
            winStreak: turnResult.winStreak,
            requiresSwitch: turnResult.requiresSwitch,
            message: 'ターン終了！switch required'
          });
        }
      }

      return res.status(200).json({
        battle: battleObj,
        battleLog: turnResult.battleLog,
        opponentTeamDefeated: turnResult.opponentTeamDefeated,
        winStreak: turnResult.winStreak,
        requiresSwitch: turnResult.requiresSwitch,
        message: 'ターン終了！'
      });
    }

    res.status(200).json({
      battle: result.battle.toObject(),
      waitingForOpponent: true,
      message: 'Action selected, waiting for opponent'
    });
  } catch (error) {
    console.error('Error in selectAction:', error);
    res.status(500).json({ error: true, message: error.message });
  }
};

// Get battle status
exports.getBattleStatus = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.battleId).populate([
      { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
      { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
    ]);
    
    if (!battle) {
      return res.status(404).json({ error: true, message: 'Battle not found' });
    }

    res.status(200).json(battle.toObject());
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

// Switch active monster (for forced switches when fainted)
exports.switchMonster = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { newIndex } = req.body;

    const battle = await Battle.findById(battleId);
    
    if (!battle) {
      return res.status(404).json({ error: true, message: 'Battle not found' });
    }

    if (battle.status === 'finished') {
      return res.status(403).json({ error: true, message: 'Battle already finished' });
    }

    // Validate new index
    if (newIndex < 0 || newIndex >= 3) {
      return res.status(400).json({ error: true, message: 'Invalid monster index' });
    }

    // Check if monster is fainted
    if (battle.player.party[newIndex].isFainted) {
      return res.status(400).json({ error: true, message: 'Cannot switch to fainted monster' });
    }

    // Switch active monster
    battle.player.activeIndex = newIndex;
    
    // Reset stat modifiers when switching in
    const switchedInMember = battle.player.party[newIndex];
    if (!switchedInMember.statModifiers) {
      switchedInMember.statModifiers = { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0 };
    } else {
      switchedInMember.statModifiers.attack = 0;
      switchedInMember.statModifiers.defense = 0;
      switchedInMember.statModifiers.magicAttack = 0;
      switchedInMember.statModifiers.magicDefense = 0;
      switchedInMember.statModifiers.speed = 0;
    }
    
    // If this was a forced switch, change status back to waiting for actions
    if (battle.status === 'waiting_for_switch') {
      battle.status = 'waiting_for_actions';
    }
    
    await battle.save();

    // Populate for response
    await battle.populate([
      { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
      { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
    ]);

    res.status(200).json({
      battle: battle.toObject()
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

// Regenerate opponent party for AI consecutive battle mode
exports.regenerateOpponentParty = async (req, res) => {
  try {
    const { battleId } = req.params;

    const battle = await Battle.findById(battleId);
    
    if (!battle) {
      return res.status(404).json({ error: true, message: 'Battle not found' });
    }

    // Generate new AI party
    const newOpponentParty = await battleService.generateRandomAIParty();
    
    // Replace opponent party
    battle.opponent.party = newOpponentParty;
    battle.opponent.activeIndex = 0;
    battle.opponent.selectedAction = { type: null };
    
    // Reset status to waiting for actions
    battle.status = 'waiting_for_actions';
    
    await battle.save();

    // Populate for response
    await battle.populate([
      { path: 'player.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] },
      { path: 'opponent.party.monsterId', populate: [{ path: 'moves' }, { path: 'ability' }] }
    ]);

    res.status(200).json({
      battle: battle.toObject()
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};
