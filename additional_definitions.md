# 運要素のないモンスターゲーム 追加定義事項

## 概要
ゲーム仕様とファイル構成に加えて、実装前に定義しておくべき詳細事項をまとめる。これにより、開発中の曖昧さを減らし、一貫性を確保する。

## API仕様
バックエンドのREST APIエンドポイントを定義。Nuxt.jsからfetchで呼び出す。

### モンスター関連API
- **GET /api/monster**: 全モンスター一覧取得
  - レスポンス: `[{ _id, name, type, stats: { hp, attack, defense, speed }, moves: [...] }]`
- **GET /api/monster/:id**: 特定モンスター取得
  - パラメータ: id (モンスターID)
  - レスポンス: モンスターオブジェクト

### バトル関連API（パーティ制3体）
- **POST /api/battle/start**: バトル開始
  - リクエスト: `{ playerMonsterIds: [id1, id2, id3], opponentMonsterIds: [id1, id2, id3] }`
  - レスポンス: `{ battle: { _id, player: { party: [...], activeIndex: 0 }, opponent: { party: [...], activeIndex: 0 }, status: 'waiting_for_actions' } }`
- **POST /api/battle/:battleId/action**: 行動選択（技実行または任意交代）
  - パラメータ: battleId
  - リクエスト: `{ actionType: 'move'|'switch', moveId?, switchToIndex? }`
  - レスポンス: `{ battle: {...}, battleLog: [...], requiresSwitch?: boolean }`
  - 備考: 両プレイヤーが行動を選択したら自動的にターン実行
- **POST /api/battle/:battleId/switch**: 強制交代（ひんし時）
  - パラメータ: battleId
  - リクエスト: `{ newIndex }`
  - レスポンス: `{ battle: {...} }`
  - 備考: ターンを消費しない
- **GET /api/battle/:battleId/status**: バトル状態取得
  - レスポンス: 現在のバトル状態

## データモデル
MongoDBのスキーマ定義 (Mongoose使用)。

### Monsterモデル
```javascript
{
  _id: ObjectId,
  name: String,           // モンスター名
  type: String,           // タイプ (fire, water, grass)
  stats: {
    hp: Number,           // 最大HP
    attack: Number,       // 攻撃力
    defense: Number,      // 防御力
    speed: Number         // 素早さ（行動順決定）
  },
  moves: [{               // 技配列（サブドキュメント）
    id: String,
    name: String,
    power: Number,        // 威力
    type: String,         // 技タイプ
    priority: Number      // 優先度（デフォルト1、高いほど先制）
  }]
}
```

### Battleモデル（パーティ制3体）
```javascript
{
  _id: ObjectId,
  player: {
    party: [{             // 3体のパーティ
      monsterId: ObjectId (ref: 'Monster'),
      currentHp: Number,
      maxHp: Number,
      isFainted: Boolean
    }],
    activeIndex: Number,  // 現在戦闘中のモンスター（0-2）
    selectedAction: {     // 選択した行動
      type: String,       // 'move' or 'switch'
      moveId: String,
      switchToIndex: Number
    }
  },
  opponent: {
    party: [{...}],
    activeIndex: Number,
    selectedAction: {...}
  },
  turn: Number,           // 現在のターン
  status: String,         // 'waiting_for_actions', 'active', 'finished'
  winner: String?,        // 'player', 'opponent', 'draw'
  lastMove: {             // 最後に実行された技
    attacker: String,
    moveId: String,
    damage: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Userモデル (将来的拡張)
```javascript
{
  _id: ObjectId,
  username: String,
  wins: Number,
  losses: Number,
  favoriteMonster: String
}
```

## ダメージ計算式
運要素なしの固定計算。タイプ相性を考慮。

### 基本ダメージ計算
```
baseDamage = (attackPower + movePower) - floor(defense / 2)
damage = max(1, floor(baseDamage * typeMultiplier))
```

- **attackPower**: 攻撃モンスターの攻撃力
- **movePower**: 技の威力 (固定値)
- **defense**: 防御モンスターの防御力
- **typeMultiplier**: タイプ相性倍率 (下記参照)

### 特殊ルール
- ダメージは最低1
- HPが0以下になったら戦闘不能（isFainted: true）
- ターン処理は2フェーズ制:
  1. 行動選択フェーズ: 両プレイヤーが技または交代を選択
  2. 実行フェーズ: 選択後、交代処理→技処理→状態異常処理を素早さ順で実行
- 行動順序:
  - 交代: 素早さが高い順
  - 技: 優先度が高い順 → 同優先度は素早さが高い順

## タイプ相性表
固定の相性倍率。モンスタータイプと技タイプの組み合わせで決定。

| 攻撃\防御 | 火 (fire) | 水 (water) | 草 (grass) |
|-----------|-----------|------------|------------|
| 火        | 1.0       | 0.5        | 2.0        |
| 水        | 2.0       | 1.0        | 0.5        |
| 草        | 0.5       | 2.0        | 1.0        |

- 2.0: 効果的 (有利)
- 1.0: 普通
- 0.5: 効果的でない (不利)

## UI/UX概要
画面設計の基本構造。

### 画面遷移
1. ホーム (index.vue): ゲーム開始ボタン
2. モンスター選択 (select.vue): プレイヤー3体、相手3体を選択
3. バトル (battle.vue): ターン制バトル実行（パーティ制）

### 主要コンポーネント
- **MonsterCard**: 画像、名前、タイプ、ステータス表示
- **BattleUI**: 
  - プレイヤーと相手の3体パーティ表示
  - 現在戦闘中のモンスターをハイライト
  - HPバー、技ボタン、交代ボタン
  - バトルログ表示
- **MoveButton**: 技選択、クリックで行動選択
- **SwitchModal**: ひんし時の強制交代モーダル

### パーティ表示
- 3体のモンスターを横並びで表示
- 現在戦闘中: 黄色枠でハイライト
- ひんし状態: グレーアウト + 「ひんし」表示
- 待機中: 通常表示

### レスポンシブデザイン
- PC: 横並びレイアウト
- モバイル: 縦並び、ボタンサイズ調整

## テスト戦略
開発中の品質確保。

### ユニットテスト (Jest)
- **services/battleService.js**: 
  - ダメージ計算関数（calculateDamage）
  - 行動順ソート（sortBySpeed, sortByPriority）
  - 交代処理（processSwitches）
  - 技処理（processMoves）
  - ひんし判定（processFainting）
- **controllers/**: APIレスポンス検証
- **components/**: Vueコンポーネントのロジック

### 統合テスト
- APIエンドポイントの結合テスト
  - バトル開始 → 行動選択 → ターン実行のフロー
  - 3体パーティの全滅判定
  - 強制交代と任意交代の区別
- フロントエンドのE2Eテスト (Cypress)

### テストデータ
- 初期モンスター: 火、水、草タイプ各2体（計6体）
- バトルシナリオ: 
  - 有利/不利の組み合わせ
  - 3体パーティでの全滅判定
  - 交代による戦略的勝利

## デプロイメント計画
本番環境への展開。

### 環境
- **開発**: ローカルDocker
- **本番**: Vercel (Nuxt.js), Heroku/Node.js, MongoDB Atlas

### CI/CD
- GitHub Actions: 自動テスト + デプロイ
- Dockerイメージ: バックエンドコンテナ化

### セキュリティ
- APIキー管理 (.env)
- CORS設定 (フロントエンドドメインのみ許可)
- 入力バリデーション (バックエンド)

## その他の考慮点
- **パフォーマンス**: 計算は軽量、DBクエリ最適化（populate使用）
- **拡張性**: 
  - 新タイプ/技の追加容易（constants.js更新）
  - 新モンスター追加（Monster.createで簡単登録）
  - 4体以上のパーティにも対応可能
- **アクセシビリティ**: キーボード操作対応
- **ローカライズ**: 多言語対応 (将来的)
- **バトルフロー**: 
  - 2フェーズ制（選択 → 実行）により戦略性向上
  - ポケモン本家同様の素早さベース行動順
  - AIは自動で最適行動を選択（現在はランダム、将来的に戦略的AIに拡張可能）

これらの定義を基に実装を開始することで、開発効率が向上する。