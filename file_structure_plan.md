# 運要素のないモンスターゲーム ファイル構成計画

## 概要
Nuxt.js (フロントエンド) と Node.js (バックエンド) を使用したゲームの実装におけるファイル構成を提案する。プロジェクトをフロントエンドとバックエンドに分離し、保守性と拡張性を確保する。データベースは MongoDB を使用し、パーティ制（3体）バトルシステムを実装。

## 全体プロジェクト構造（現在実装済み）
```
project-root/
├── frontend/                 # Nuxt.js フロントエンド
│   └── app/                  # Nuxtアプリケーションディレクトリ
│       ├── pages/            # ページコンポーネント
│       ├── components/       # UIコンポーネント
│       └── app.vue           # ルートコンポーネント
├── backend/                  # Node.js バックエンド
│   └── src/                  # ソースコード
│       ├── models/           # Mongooseモデル
│       ├── routes/           # APIルート
│       ├── controllers/      # コントローラー
│       ├── services/         # ビジネスロジック
│       ├── config/           # 設定ファイル
│       └── utils/            # ユーティリティ
├── docker-compose.yml        # MongoDB設定
└── README.md                 # プロジェクト説明
```

## フロントエンド (frontend/app/) - Nuxt.js
Nuxt.js の標準構造を採用。ページベースのルーティング、コンポーネント分割を実装。

```
frontend/app/
├── pages/                    # ページコンポーネント (自動ルーティング)
│   ├── index.vue            # ホーム/トップページ
│   ├── select.vue           # モンスター選択画面（3体ずつ選択）
│   └── battle.vue           # バトル画面（パーティ制バトル）
├── components/               # 再利用可能なコンポーネント
│   ├── MonsterCard.vue      # モンスター表示カード
│   ├── BattleUI.vue         # バトルインターフェース
│   │                        # - 3体パーティ表示
│   │                        # - HPバー、技ボタン、交代ボタン
│   │                        # - バトルログ表示
│   ├── PartyDisplay.vue     # パーティ3体の表示（将来的分離）
│   └── SwitchModal.vue      # 強制交代モーダル（将来的分離）
├── app.vue                   # ルートコンポーネント
├── nuxt.config.ts           # Nuxt設定ファイル
└── package.json             # 依存関係
```

### 主要ファイルの役割
- **pages/**: 各画面のVueコンポーネント。Nuxtの自動ルーティングを使用。
- **components/**: UI部品を分割。
  - BattleUI.vue: パーティ表示、技選択、交代ボタン、バトルログを統合
  - MonsterCard.vue: モンスター情報の表示（名前、タイプ、HP、ステータス）
- **状態管理**: 現在は各コンポーネントでrefを使用、将来的にPiniaで集約可能

## バックエンド (backend/src/) - Node.js + Express
Express.js を使用したREST API構成。MVCパターンを採用し、ロジックを分離。

```
backend/src/
├── routes/                   # APIルート定義
│   ├── monster.js            # モンスター関連API (/api/monster)
│   └── battle.js             # バトル関連API (/api/battle)
│       ├── POST /start              # バトル開始（3体パーティ）
│       ├── POST /:id/action         # 行動選択（技/交代）
│       ├── POST /:id/switch         # 強制交代（ひんし時）
│       └── GET /:id/status          # バトル状態取得
├── models/                   # データモデル (Mongooseスキーマ)
│   ├── Monster.js            # モンスター（stats.speed, moves.priority追加済み）
│   └── Battle.js             # バトルセッション（パーティ制、selectedAction）
├── controllers/              # リクエスト処理ロジック
│   ├── monsterController.js  # モンスターCRUD
│   └── battleController.js   # バトル処理
│       ├── startBattle()           # 3体パーティでバトル開始
│       ├── selectAction()          # 行動選択 + AI自動選択 + ターン実行
│       ├── switchMonster()         # 強制交代処理
│       └── getBattleStatus()       # 状態取得
├── services/                 # ビジネスロジック
│   └── battleService.js      # バトルコアロジック
│       ├── calculateDamage()       # ダメージ計算
│       ├── selectAIAction()        # AI行動選択
│       ├── executeTurn()           # ターン実行
│       ├── processSwitches()       # 交代処理（素早さ順）
│       ├── processMoves()          # 技処理（優先度→素早さ順）
│       ├── processDamage()         # HP減算
│       ├── processFainting()       # ひんし判定・全滅チェック
│       └── processStatusEffects()  # 状態異常（将来的拡張）
├── config/                   # 設定ファイル
│   ├── database.js           # MongoDB接続設定
│   └── constants.js          # 定数（タイプ相性表、優先度）
├── utils/                    # ユーティリティ関数
│   └── helpers.js            # 共通ヘルパー
├── scripts/                  # データ投入スクリプト
│   └── seedMonsters.js       # 初期モンスター6体を投入
└── server.js                 # サーバー起動ファイル
```

### 主要ファイルの役割
- **routes/**: APIエンドポイント定義。フロントからのリクエストを受け付ける。
- **models/**: 
  - Monster: stats.speed, moves.priority追加済み
  - Battle: パーティ制（party配列3体）、selectedAction（行動選択保存）
- **controllers/**: 
  - selectAction: プレイヤー行動受信 → AI自動選択 → 両方準備完了でexecuteTurn
  - switchMonster: ひんし時の強制交代（ターン消費なし）
- **services/battleService.js**: 
  - 2フェーズ制ターン処理の実装
  - 素早さベースの行動順ソート
  - タイプ相性を考慮したダメージ計算
  - パーティ全滅判定
- **config/constants.js**: TYPE_CHART（タイプ相性表）、MOVE_PRIORITIES定義

## 共通部分（現在は未使用）
将来的にフロントとバックで共有するデータや型定義を配置。

```
shared/                       # 将来的拡張用
├── types/                    # TypeScript型定義
│   ├── monster.ts
│   └── battle.ts
├── constants/                # 共有定数
│   ├── types.js             # モンスタータイプと相性表
│   └── moves.js             # 技データ
└── data/                     # 初期データ
    └── monsterData.json     # モンスター初期データ
```

### 現在の実装
- タイプ相性表はbackend/src/config/constants.jsに配置
- 初期モンスターデータはbackend/src/scripts/seedMonsters.jsで定義
- 将来的にTypeScript化する際にsharedディレクトリを活用

## データベース設定 (docker-compose.yml)
MongoDB をDockerで起動。

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    container_name: monster_battle_db
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: monster_battle
    volumes:
      - mongo_data:/data/db
    networks:
      - monster_battle_network

networks:
  monster_battle_network:
    driver: bridge

volumes:
  mongo_data:
    driver: local
```

### データベース構築
1. `docker-compose up -d` でMongoDB起動
2. `cd backend && npm install`
3. `npm run seed` で初期モンスター6体を投入
4. `npm run dev` でバックエンドサーバー起動

## 実装時の考慮点
- **API設計**: RESTful APIを採用。バトル状態はDB永続化。
- **セキュリティ**: バックエンドでダメージ計算・行動順決定を行い、フロントからの改ざんを防ぐ。
- **拡張性**: 
  - 新モンスター追加: backend/src/scripts/seedMonsters.js更新
  - 新技追加: Monsterモデルのmoves配列に追加
  - パーティ数変更: Battle.jsのparty配列サイズとactiveIndex上限を変更
- **テスト**: 各ディレクトリに __tests__/ フォルダを追加 (Jest使用)。
- **開発フロー**:
  1. バックエンド開発: モデル → サービス → コントローラー → ルート
  2. フロントエンド開発: ページ → コンポーネント → API統合
  3. 統合テスト: E2Eでバトルフロー検証
- **2フェーズターン制**: 
  - フロントからactionを送信 → バックでAI自動選択 → executeTurn実行
  - ひんし時は強制交代モーダル表示 → /switch で交代（ターン消費なし）
- **Populate使用**: MonsterIdをMonsterオブジェクトに展開し、フロントで詳細表示

この構成はスケーラブルで、将来的な対人戦（WebSocket）やモバイル対応を容易にする。