const Battle = require('../models/Battle');
const Monster = require('../models/Monster');

// マッチングキュー（待機中のプレイヤー）
const matchmakingQueue = [];

// アクティブなバトルセッション
const activeBattles = new Map();

// Socket.IOインスタンス
let io = null;

/**
 * Socket.IOを初期化
 */
function initialize(socketIO) {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // マッチング開始
    socket.on('join-matchmaking', async (data) => {
      try {
        console.log('Player joining matchmaking:', socket.id, data);
        
        const { playerMonsterIds } = data;

        // プレイヤーをキューに追加
        const player = {
          socketId: socket.id,
          playerMonsterIds,
          joinedAt: Date.now()
        };

        matchmakingQueue.push(player);
        console.log('Queue length:', matchmakingQueue.length);

        // 全プレイヤーに待機人数を通知
        io.emit('queue-update', { waitingPlayers: matchmakingQueue.length });

        // 2人揃ったらマッチング
        if (matchmakingQueue.length >= 2) {
          const player1 = matchmakingQueue.shift();
          const player2 = matchmakingQueue.shift();
          
          await createPvPBattle(player1, player2);
          
          // 残りのプレイヤーに待機人数を更新
          io.emit('queue-update', { waitingPlayers: matchmakingQueue.length });
        }
      } catch (error) {
        console.error('Error in join-matchmaking:', error);
        socket.emit('error', { message: 'マッチングエラーが発生しました' });
      }
    });

    // マッチングキャンセル
    socket.on('cancel-matchmaking', () => {
      const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
      if (index !== -1) {
        matchmakingQueue.splice(index, 1);
        console.log('Player cancelled matchmaking:', socket.id);
        io.emit('queue-update', { waitingPlayers: matchmakingQueue.length });
      }
    });

    // プレイヤーアクション（技選択・交代）
    socket.on('player-action', async (data) => {
      try {
        console.log('=== player-action event received ===');
        console.log('Socket ID:', socket.id);
        console.log('Data received:', data);
        const { battleId, action } = data;
        console.log('Player action:', socket.id, battleId, action);
        console.log('Active battles:', Array.from(activeBattles.keys()));

        const battleSession = activeBattles.get(battleId);
        console.log('Battle session found:', battleSession);
        if (!battleSession) {
          console.log('ERROR: Battle not found in activeBattles');
          socket.emit('error', { message: 'バトルが見つかりません' });
          return;
        }

        // どちらのプレイヤーか判定
        const playerSide = battleSession.player1SocketId === socket.id ? 'player1' : 'player2';
        
        // バトルを取得
        const battle = await Battle.findById(battleId).populate([
          { path: 'player.party.monsterId', populate: { path: 'moves' } },
          { path: 'opponent.party.monsterId', populate: { path: 'moves' } }
        ]);
        if (!battle) {
          socket.emit('error', { message: 'バトルデータが見つかりません' });
          return;
        }

        // アクションを記録
        if (playerSide === 'player1') {
          battle.player.selectedAction = action;
        } else {
          battle.opponent.selectedAction = action;
        }

        await battle.save();

        // If battle is waiting for switch, handle switch immediately
        if (battle.status === 'waiting_for_switch') {
          console.log('Battle is waiting_for_switch, processing switch action');
          console.log('Action received:', action);
          console.log('Player active index before switch:', battle.player.activeIndex, 'isFainted:', battle.player.party[battle.player.activeIndex].isFainted);
          console.log('Opponent active index before switch:', battle.opponent.activeIndex, 'isFainted:', battle.opponent.party[battle.opponent.activeIndex].isFainted);
          
          // Check if this is a switch action
          if (action.type === 'switch') {
            // Apply the switch
            if (playerSide === 'player1') {
              const newIndex = action.switchToIndex;
              if (newIndex >= 0 && newIndex < 3 && !battle.player.party[newIndex].isFainted) {
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
                // Clear selectedAction after switch
                battle.player.selectedAction = { type: null };
                console.log('Player switched to index:', newIndex);
              }
            } else {
              const newIndex = action.switchToIndex;
              if (newIndex >= 0 && newIndex < 3 && !battle.opponent.party[newIndex].isFainted) {
                battle.opponent.activeIndex = newIndex;
                // Reset stat modifiers when switching in
                const switchedInMember = battle.opponent.party[newIndex];
                if (!switchedInMember.statModifiers) {
                  switchedInMember.statModifiers = { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0 };
                } else {
                  switchedInMember.statModifiers.attack = 0;
                  switchedInMember.statModifiers.defense = 0;
                  switchedInMember.statModifiers.magicAttack = 0;
                  switchedInMember.statModifiers.magicDefense = 0;
                  switchedInMember.statModifiers.speed = 0;
                }
                // Clear selectedAction after switch
                battle.opponent.selectedAction = { type: null };
                console.log('Opponent switched to index:', newIndex);
              }
            }
            
            // Check if both players have switched (if both needed to)
            const playerNeedsSwitch = battle.player.party[battle.player.activeIndex].isFainted;
            const opponentNeedsSwitch = battle.opponent.party[battle.opponent.activeIndex].isFainted;
            
            console.log('Switch check:', { playerNeedsSwitch, opponentNeedsSwitch });
            
            // If no one needs to switch anymore, resume battle
            if (!playerNeedsSwitch && !opponentNeedsSwitch) {
              battle.status = 'waiting_for_actions';
              console.log('Both players have valid active monsters, resuming battle');
            }
            
            await battle.save();
            
            // Send updated battle state
            io.to(battleSession.player1SocketId).emit('battle-update', {
              battle: battle,
              battleLog: [],
              yourSide: 'player'
            });
            
            io.to(battleSession.player2SocketId).emit('battle-update', {
              battle: battle,
              battleLog: [],
              yourSide: 'opponent'
            });
          }
          
          return; // Don't execute turn while waiting for switch
        }

        // 両プレイヤーがアクション選択完了したらターン実行
        if (battle.player.selectedAction?.type && battle.opponent.selectedAction?.type) {
          console.log('Both players have selected actions - executing turn');
          const battleService = require('./battleService');
          const turnResult = await battleService.executeTurn(battle);
          console.log('Turn executed, battle status:', turnResult.battle.status);

          // 両プレイヤーにバトル状態を送信
          console.log('Emitting battle-update to player1:', battleSession.player1SocketId);
          io.to(battleSession.player1SocketId).emit('battle-update', {
            battle: turnResult.battle,
            battleLog: turnResult.battleLog,
            yourSide: 'player'
          });

          console.log('Emitting battle-update to player2:', battleSession.player2SocketId);
          io.to(battleSession.player2SocketId).emit('battle-update', {
            battle: turnResult.battle,
            battleLog: turnResult.battleLog,
            yourSide: 'opponent'
          });

          console.log('battle-update events emitted');

          // バトル終了チェック
          if (turnResult.battle.status === 'finished') {
            console.log('Battle finished!');
            handleBattleEnd(battleId, turnResult.battle);
          }
        } else {
          console.log('Waiting for other player action');
          console.log('Player action:', battle.player.selectedAction);
          console.log('Opponent action:', battle.opponent.selectedAction);
        }
      } catch (error) {
        console.error('Error in player-action:', error);
        socket.emit('error', { message: 'アクション処理エラーが発生しました' });
      }
    });

    // アクションキャンセル
    socket.on('cancel-action', async (data) => {
      try {
        console.log('=== cancel-action event received ===');
        console.log('Socket ID:', socket.id);
        const { battleId } = data;
        
        const battleSession = activeBattles.get(battleId);
        if (!battleSession) {
          socket.emit('error', { message: 'バトルが見つかりません' });
          return;
        }

        // どちらのプレイヤーか判定
        const playerSide = battleSession.player1SocketId === socket.id ? 'player1' : 'player2';
        
        // バトルを取得
        const battle = await Battle.findById(battleId).populate([
          { path: 'player.party.monsterId', populate: { path: 'moves' } },
          { path: 'opponent.party.monsterId', populate: { path: 'moves' } }
        ]);
        if (!battle) {
          socket.emit('error', { message: 'バトルデータが見つかりません' });
          return;
        }

        // アクションをクリア
        if (playerSide === 'player1') {
          battle.player.selectedAction = { type: null };
        } else {
          battle.opponent.selectedAction = { type: null };
        }

        await battle.save();
        
        console.log('Action cancelled for', playerSide);
        
        // キャンセル完了を通知
        socket.emit('action-cancelled', {
          battle: battle,
          yourSide: playerSide === 'player1' ? 'player' : 'opponent'
        });
      } catch (error) {
        console.error('Error in cancel-action:', error);
        socket.emit('error', { message: 'アクションキャンセルエラーが発生しました' });
      }
    });

    // 切断処理
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      
      // マッチングキューから削除
      const queueIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
        io.emit('queue-update', { waitingPlayers: matchmakingQueue.length });
      }

      // アクティブなバトルから削除（対戦相手に通知）
      for (const [battleId, session] of activeBattles.entries()) {
        if (session.player1SocketId === socket.id || session.player2SocketId === socket.id) {
          const opponentSocketId = session.player1SocketId === socket.id 
            ? session.player2SocketId 
            : session.player1SocketId;
          
          io.to(opponentSocketId).emit('opponent-disconnected', {
            message: '対戦相手が切断しました'
          });

          activeBattles.delete(battleId);
          break;
        }
      }
    });
  });
}

/**
 * PvPバトルを作成
 */
async function createPvPBattle(player1, player2) {
  try {
    console.log('Creating PvP battle between', player1.socketId, 'and', player2.socketId);

    // モンスターデータ取得
    const player1Monsters = await Monster.find({ _id: { $in: player1.playerMonsterIds } });
    const player2Monsters = await Monster.find({ _id: { $in: player2.playerMonsterIds } });

    if (player1Monsters.length !== 3 || player2Monsters.length !== 3) {
      throw new Error('Invalid monster selection');
    }

    // バトル作成（player1 vs player2として保存）
    console.log('Creating battle with userIds:', {
      player1SocketId: player1.socketId,
      player2SocketId: player2.socketId
    });
    
    const battle = new Battle({
      player: {
        userId: player1.socketId, // Use socketId as userId for PvP detection
        party: player1Monsters.map(monster => ({
          monsterId: monster._id,
          currentHp: monster.stats.hp,
          maxHp: monster.stats.hp,
          isFainted: false,
          status: 'none',
          sleepTurnsRemaining: 0,
          statModifiers: { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0 }
        })),
        activeIndex: 0,
        selectedAction: { type: null }
      },
      opponent: {
        userId: player2.socketId, // Use socketId as userId for PvP detection
        party: player2Monsters.map(monster => ({
          monsterId: monster._id,
          currentHp: monster.stats.hp,
          maxHp: monster.stats.hp,
          isFainted: false,
          status: 'none',
          sleepTurnsRemaining: 0,
          statModifiers: { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0 }
        })),
        activeIndex: 0,
        selectedAction: { type: null }
      },
      status: 'waiting_for_actions',
      turn: 1,
      battleType: 'pvp' // 対人戦フラグ
    });

    await battle.save();
    await battle.populate('player.party.monsterId opponent.party.monsterId');

    console.log('Battle created and saved:', {
      battleId: battle._id.toString(),
      playerUserId: battle.player.userId,
      opponentUserId: battle.opponent.userId,
      battleType: battle.battleType
    });

    // アクティブバトルセッションに登録
    activeBattles.set(battle._id.toString(), {
      player1SocketId: player1.socketId,
      player2SocketId: player2.socketId,
      battleId: battle._id.toString()
    });

    console.log('Battle created:', battle._id);

    // 両プレイヤーにマッチング成功を通知
    console.log('Emitting match-found to player1:', player1.socketId);
    io.to(player1.socketId).emit('match-found', {
      battleId: battle._id.toString(),
      yourSide: 'player'
    });

    console.log('Emitting match-found to player2:', player2.socketId);
    io.to(player2.socketId).emit('match-found', {
      battleId: battle._id.toString(),
      yourSide: 'opponent'
    });

    console.log('Match-found events emitted successfully');
  } catch (error) {
    console.error('Error creating PvP battle:', error);
    io.to(player1.socketId).emit('error', { message: 'バトル作成エラー' });
    io.to(player2.socketId).emit('error', { message: 'バトル作成エラー' });
  }
}

/**
 * バトル終了処理
 */
function handleBattleEnd(battleId, battle) {
  const session = activeBattles.get(battleId);
  if (!session) return;

  // 勝敗結果を両プレイヤーに通知
  io.to(session.player1SocketId).emit('battle-end', {
    winner: battle.winner,
    yourSide: 'player',
    result: battle.winner === 'player' ? 'win' : 'lose'
  });

  io.to(session.player2SocketId).emit('battle-end', {
    winner: battle.winner,
    yourSide: 'opponent',
    result: battle.winner === 'opponent' ? 'win' : 'lose'
  });

  // セッションを削除
  activeBattles.delete(battleId);
  console.log('Battle ended:', battleId);
}

module.exports = {
  initialize,
  getActiveBattles: () => activeBattles,
  getQueueLength: () => matchmakingQueue.length
};
