# Monster Battle Game - Database Setup

## データベース構築手順

### 1. MongoDBをDockerで起動
プロジェクトルートで以下のコマンドを実行:

```powershell
docker-compose up -d
```

MongoDBが `localhost:27017` で起動します。

### 2. 依存関係のインストール
backendディレクトリに移動して依存関係をインストール:

```powershell
cd backend
npm install
```

### 3. データベースのシード（初期データ投入）
初期モンスターデータを投入:

```powershell
npm run seed
```

以下の6体のモンスターが登録されます:
- **ファイロ** (fire) - HP:100, 攻撃:60, 防御:40, 素早さ:70
- **アクアス** (water) - HP:110, 攻撃:55, 防御:50, 素早さ:60
- **グラスリー** (grass) - HP:105, 攻撃:50, 防御:60, 素早さ:55
- **インフェルノ** (fire) - HP:95, 攻撃:70, 防御:35, 素早さ:80
- **ハイドロン** (water) - HP:115, 攻撃:50, 防御:55, 素早さ:50
- **フォレスタ** (grass) - HP:100, 攻撃:55, 防御:65, 素早さ:45

### 4. サーバー起動
```powershell
npm run dev
```

サーバーが `http://localhost:5000` で起動します。

### 5. 動作確認
ブラウザまたはcurlで確認:

```powershell
# ヘルスチェック
curl http://localhost:5000/health

# モンスター一覧取得
curl http://localhost:5000/api/monster
```

## データベース停止
```powershell
docker-compose down
```

データを保持したまま停止する場合は `-v` オプションを付けない。
データも削除する場合は `docker-compose down -v`。

## トラブルシューティング
- **ポート27017が使用中**: 他のMongoDBインスタンスを停止するか、`.env`でポートを変更
- **接続エラー**: `docker-compose ps` でMongoDBコンテナが起動しているか確認
