# 運要素のないモンスターゲーム バトル処理詳細

## 概要
バトルシステムの詳細な処理ロジックを定義。ターン制バトルにおける状態管理、ダメージ計算、勝利判定などを明確にし、実装時の指針とする。パーティ制（3体）を採用し、ポケモンバトルを参考にした2フェーズターン制処理。

## バトルフロー
バトルの全体的な流れを詳細に記述。

### 1. バトル開始
- **入力**: playerMonsterIds (3体の配列), opponentMonsterIds (3体の配列)
- **処理**:
  - モンスターIDからデータを取得
  - バトルセッション作成 (DB保存)
  - 各モンスターの初期状態設定: currentHp = maxHp, isFainted = false
  - activeIndex = 0 (最初のモンスターが戦闘開始)
  - status = 'waiting_for_actions', turn = 1
- **出力**: battle { _id, player, opponent, status, turn }

### 2. ターン処理ループ
バトルが終了するまで繰り返す。**2フェーズ制**を採用。

#### フェーズ1: 行動選択 (selectAction)
- **プレイヤー**: フロントエンドから action を受け取る
  - `{ actionType: 'move', moveId }` または
  - `{ actionType: 'switch', switchToIndex }`
- **相手（AI）**: battleService.selectAIAction() で自動選択
  - 現在: ランダムに技を選択
  - 将来的: タイプ相性を考慮した戦略的選択
- **selectedActionに保存**: battle.player.selectedAction, battle.opponent.selectedAction
- **両方選択完了後**: executeTurn() を呼び出し

#### フェーズ2: ターン実行 (executeTurn)
両プレイヤーの行動が選択されたら以下の順序で処理:

##### 1. processSwitches()
- **処理順**: 素早さが高い順（現在戦闘中のモンスターの速度で比較）
- **処理内容**:
  - selectedAction.type === 'switch' の場合
  - activeIndex を switchToIndex に変更
  - 交代後着地時発生特性があれば発動 (将来的拡張)

##### 2. processMoves()
- **処理順**: 
  1. 優先度が高い順（priority: 5 → 1）
  2. 同優先度内では素早さが高い順
- **各技実行時**:
  - processPreMoveAbilities() (将来的拡張)
  - processDamage() - ダメージ計算とHP減算
  - processMoveEffects() (将来的拡張)
  - processFainting() - ひんし判定

##### 3. processStatusEffects()
- **処理順**: 素早さが高い順
- **処理内容**:
  - 毒、火傷などの状態異常ダメージ (将来的拡張)
  - processFainting() 呼び出し

##### 4. updateTurn()
- turn += 1
- selectedAction をリセット (type: null)
- status = 'waiting_for_actions'
- バトル状態をDB保存

#### processFainting() - ひんし処理
- **HP <= 0のモンスター**を isFainted: true に設定
- **全滅チェック**:
  - party.every(m => m.isFainted) の場合
  - status = 'finished', winner設定
- **一部ひんし**:
  - プレイヤー: requiresSwitch = true を返し、フロントで強制交代モーダル表示
  - 相手（AI）: 自動で次の生存モンスターに交代（activeIndexを更新）

### 3. バトル終了
- **全滅判定**: いずれかのプレイヤーの全モンスターがひんし
- status = 'finished'
- winner 設定 ('player' or 'opponent')
- 結果をDB保存
- フロントエンドに勝敗画面表示

### 4. 強制交代処理 (POST /switch)
- **発生条件**: モンスターがひんしになった場合
- **処理**:
  - activeIndex を newIndex に変更
  - status = 'waiting_for_actions' に戻す
  - **ターンを消費しない**（次のターンで行動選択から再開）
- **備考**: 任意交代（actionType: 'switch'）とは別処理

## ダメージ計算詳細
運要素なしの固定計算。すべての値は整数で扱う。

### 基本式
```javascript
const baseDamage = (attackPower + movePower) - Math.floor(defense / 2);
const damage = Math.max(1, Math.floor(baseDamage * typeMultiplier));
```

### パラメータ説明
- **attackPower**: 攻撃側モンスターの攻撃力 (stats.attack)
- **movePower**: 選択した技の威力 (moves.power)
- **defense**: 防御側モンスターの防御力 (stats.defense)
- **typeMultiplier**: タイプ相性倍率 (1.0, 2.0, 0.5)

### タイプ相性適用
```javascript
const TYPE_CHART = {
  fire: { fire: 1.0, water: 0.5, grass: 2.0 },
  water: { fire: 2.0, water: 1.0, grass: 0.5 },
  grass: { fire: 0.5, water: 2.0, grass: 1.0 }
};
```
- 技タイプと防御側モンスタータイプの組み合わせで倍率決定
- 例: 火技 vs 水モンスター = 0.5倍（効果的でない）
- 例: 水技 vs 火モンスター = 2.0倍（効果的）

### 特殊ルール
- **最低ダメージ**: 1 (ダメージが0以下の場合は1)
- **最大ダメージ**: 防御側currentHpを超えない（currentHp = Math.max(0, currentHp - damage)）
- **計算順序**: まずダメージ計算、次にHP減算、最後にひんし判定
- **整数化**: Math.floor()で整数化

### 計算例
```javascript
// 攻撃モンスター: 攻撃力60, 技威力30 (火タイプ)
// 防御モンスター: 防御力50 (草タイプ)
// タイプ相性: 火 vs 草 = 2.0
const baseDamage = (60 + 30) - Math.floor(50 / 2);  // 90 - 25 = 65
const damage = Math.max(1, Math.floor(65 * 2.0));   // 130
```

## 状態管理
バトル中の状態を正確に管理。パーティ制（3体）対応。

### バトル状態オブジェクト
```javascript
{
  _id: String (battleId),
  status: 'waiting_for_actions' | 'active' | 'finished',
  turn: Number,
  player: {
    party: [{
      monsterId: ObjectId (populated: Monster),
      currentHp: Number,
      maxHp: Number,
      isFainted: Boolean
    }],
    activeIndex: Number (0-2),
    selectedAction: {
      type: 'move' | 'switch' | null,
      moveId: String,
      switchToIndex: Number
    }
  },
  opponent: {
    party: [{...}],
    activeIndex: Number,
    selectedAction: {...}
  },
  lastMove: {
    attacker: 'player' | 'opponent',
    moveId: String,
    damage: Number
  },
  winner: 'player' | 'opponent' | null,
  createdAt: Date,
  updatedAt: Date
}
```

### 状態遷移
- **waiting_for_actions**: 行動選択待ち（初期状態、各ターン開始時）
- **active**: ターン実行中（processSwitches → processMoves → processStatusEffects）
- **finished**: バトル終了、技実行不可

### 永続化
- 各ターン終了時にDB更新（updateTurn内でsave）
- フロントエンドは最新状態をバトルログと共に受信
- Populate使用: monsterId参照を実際のMonsterオブジェクトに展開

## AIロジック (相手ターン)
運要素なしなので、戦略的な選択。パーティ制対応。

### 基本AI（現在実装）
```javascript
function selectAIAction(battle) {
  // シンプル版: ランダムに技を選択
  const opponentActive = battle.opponent.party[battle.opponent.activeIndex];
  const opponentMonster = opponentActive.monsterId;
  const randomMove = opponentMonster.moves[
    Math.floor(Math.random() * opponentMonster.moves.length)
  ];
  
  battle.opponent.selectedAction = {
    type: 'move',
    moveId: randomMove.id
  };
}
```

### 拡張版AI（将来的実装）
```javascript
function selectAIAction(battle) {
  const playerActive = battle.player.party[battle.player.activeIndex].monsterId;
  const opponentMonster = battle.opponent.party[battle.opponent.activeIndex].monsterId;
  
  // タイプ相性を考慮した最適技選択
  const effectiveMoves = opponentMonster.moves.filter(move => 
    TYPE_CHART[move.type][playerActive.type] > 1.0
  );
  
  if (effectiveMoves.length > 0) {
    // 効果的な技があれば優先
    return { type: 'move', moveId: effectiveMoves[0].id };
  }
  
  // 不利な場合は交代を検討
  if (TYPE_CHART[playerActive.type][opponentMonster.type] > 1.0) {
    const betterMonster = findBetterSwitch(battle, playerActive.type);
    if (betterMonster !== -1) {
      return { type: 'switch', switchToIndex: betterMonster };
    }
  }
  
  // デフォルト: 最高威力の技
  const strongestMove = opponentMonster.moves.reduce((a, b) => 
    a.power > b.power ? a : b
  );
  return { type: 'move', moveId: strongestMove.id };
}
```

### 実装のポイント
- **selectAction呼び出し時**: プレイヤーが行動を選択したら、AIも自動選択
- **自動交代**: ひんし時は次の生存モンスターに自動交代（processFainting内）

## エラー処理
バトル中の異常を適切に処理。パーティ制対応。

### 入力バリデーション
- **無効なmoveId**: モンスターの技リストに存在しない
- **無効なswitchToIndex**: 範囲外（0-2以外）またはひんしモンスターへの交代
- **バトル終了後の操作**: status === 'finished' の場合拒否
- **HP異常**: currentHp > maxHp または currentHp < 0
- **パーティサイズ**: 必ず3体（開始時にバリデーション）

### エラーレスポンス
```javascript
{
  error: true,
  message: 'Invalid move' | 
           'Battle already finished' | 
           'Invalid HP value' |
           'Must select exactly 3 monsters for each player' |
           'Cannot switch to fainted monster',
  code: 400 | 403 | 404 | 500
}
```

### エラーハンドリング実装
```javascript
// battleController.js
try {
  // バトル処理
} catch (err) {
  console.error('Battle error:', err);
  res.status(500).json({ 
    error: true, 
    message: err.message 
  });
}

// battleService.js
function processMoves(battle) {
  try {
    // 技処理ロジック
  } catch (err) {
    console.error('Process moves error:', err);
    throw err;
  }
}
```

### 回復処理
- バトル開始時にHPをmaxHpにリセット
- 異常状態検知時はエラーをスロー、フロントでエラー表示

## パフォーマンス考慮
- **計算負荷**: シンプルな算術のみ、処理は軽量
- **DBクエリ最小化**: 
  - Populate使用でN+1問題回避
  - 各ターンでsave()は1回のみ
  - バトル状態は1ドキュメントで管理
- **同時実行**: battleIdで分離、複数バトル同時実行可能
- **メモリ**: パーティ3体でも状態オブジェクトは軽量（数KB程度）

## 拡張性
- **対人戦**: WebSocketでリアルタイム技選択（現在は即時AI応答）
- **4体以上のパーティ**: party配列とactiveIndex上限を変更するだけ
- **ステータス異常**: processStatusEffects内に毒・麻痺等のロジック追加
- **特性・持ち物**: Monster/Battleモデルにフィールド追加
- **ダブルバトル**: activeIndexを配列化（activeIndexes: [0, 1]）

この詳細を基に、バトルサービスを実装する。

## 関数定義
ターン処理ループ内の処理を関数にまとめた詳細。

### selectActions(battleState)
- **入力**: battleState
- **処理**: 両プレイヤーの行動選択
- **出力**: 更新されたbattleState (actions設定)

### processBattleTurn(battleState)
- **入力**: battleState
- **処理**: バトル処理全体の実行
- **出力**: 更新されたbattleState

#### processSwitches(battleState)
- **入力**: battleState
- **処理**:
  - モンスターの素早さ順に交換処理
  - 交換先選択時: モンスター交換 + 特性発動
- **出力**: 更新されたbattleState

#### processMoves(battleState)
- **入力**: battleState
- **処理**:
  - 優先度5から1までループ
  - 各優先度で素早さ順に技処理
- **出力**: 更新されたbattleState

##### processPreMoveAbilities(battleState, move)
- **入力**: battleState, move
- **処理**: 技実行前の特性発動
- **出力**: 更新されたbattleState

##### processDamage(battleState, move)
- **入力**: battleState, move
- **処理**: ダメージ計算とHP更新
- **出力**: 更新されたbattleState

##### processMoveEffects(battleState, move)
- **入力**: battleState, move
- **処理**: 技の追加効果処理
- **出力**: 更新されたbattleState

##### processFainting(battleState)
- **入力**: battleState
- **処理**:
  - HP <= 0 のモンスター判定
  - 特性発動
  - 全滅チェック
  - 勝敗処理または次のモンスター選択
- **出力**: 更新されたbattleState

#### processStatusEffects(battleState)
- **入力**: battleState
- **処理**:
  - 素早さ順に状態異常ダメージ
  - processFainting() 呼び出し
- **出力**: 更新されたbattleState

### updateTurn(battleState)
- **入力**: battleState
- **処理**: turnインクリメント、状態保存
- **出力**: 更新されたbattleState