const Battle = require('../models/Battle');
const Monster = require('../models/Monster');
const battleService = require('../services/battleService');

// Start a new battle
exports.startBattle = async (req, res) => {
  console.log('====== BATTLECONTROLLER.JS - NEW VERSION LOADED ======');
  try {
    const { playerMonsterIds, opponentMonsterIds } = req.body;

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
      status: 'waiting_for_actions'
    });

    await battle.save();

    // Populate for response
    await battle.populate([
      { path: 'player.party.monsterId', populate: { path: 'moves' } },
      { path: 'opponent.party.monsterId', populate: { path: 'moves' } }
    ]);

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
      { path: 'player.party.monsterId', populate: { path: 'moves' } },
      { path: 'opponent.party.monsterId', populate: { path: 'moves' } }
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
        { path: 'player.party.monsterId', populate: { path: 'moves' } },
        { path: 'opponent.party.monsterId', populate: { path: 'moves' } }
      ]);

      const battleObj = turnResult.battle.toObject();
      console.log('After turn - Player statModifiers:', battleObj.player.party[0].statModifiers);

      // If opponent needs to switch after attack, auto-select for AI
      if (turnResult.requiresSwitch?.opponent && turnResult.battle.status === 'waiting_for_switch') {
        await battleService.selectAIAction(turnResult.battle);
        console.log('AI auto-selected switch after attack move');
        
        // Check if both have now selected switch actions
        if (turnResult.battle.player.selectedAction?.type && turnResult.battle.opponent.selectedAction?.type) {
          // Execute the switch turn
          const switchTurnResult = await battleService.executeTurn(turnResult.battle);
          
          // Re-populate
          await switchTurnResult.battle.populate([
            { path: 'player.party.monsterId', populate: { path: 'moves' } },
            { path: 'opponent.party.monsterId', populate: { path: 'moves' } }
          ]);
          
          return res.status(200).json({
            battle: switchTurnResult.battle.toObject(),
            battleLog: [...turnResult.battleLog, ...switchTurnResult.battleLog],
            requiresSwitch: switchTurnResult.requiresSwitch,
            message: 'Turn and switch executed'
          });
        }
      }

      return res.status(200).json({
        battle: battleObj,
        battleLog: turnResult.battleLog,
        requiresSwitch: turnResult.requiresSwitch,
        message: 'Turn executed'
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
      { path: 'player.party.monsterId', populate: { path: 'moves' } },
      { path: 'opponent.party.monsterId', populate: { path: 'moves' } }
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
      { path: 'player.party.monsterId', populate: { path: 'moves' } },
      { path: 'opponent.party.monsterId', populate: { path: 'moves' } }
    ]);

    res.status(200).json({
      battle: battle.toObject()
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};
