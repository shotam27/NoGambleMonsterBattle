# NoGambleMonsterBattle デプロイガイド

## 📋 概要
運要素のないモンスターバトルゲーム

## 🚀 Renderへのデプロイ手順

### 1️⃣ バックエンド (Web Service)

**設定:**
- **Name:** `nogamblemonsterbattle`
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** Node

**環境変数:**
```
MONGODB_URI=mongodb+srv://admin:gero1934@monsterbattle.gzznpqm.mongodb.net/monster-battle?retryWrites=true&w=majority&appName=MonsterBattle
PORT=5000
NODE_ENV=production
CLIENT_URL=<フロントエンドのURL>
```

### 2️⃣ フロントエンド (Static Site)

**設定:**
- **Name:** `monster-battle-frontend`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run generate`
- **Publish Directory:** `.output/public`

**環境変数:**
```
NUXT_PUBLIC_API_URL=https://nogamblemonsterbattle.onrender.com
```

## 💻 ローカル開発

### バックエンド
```bash
cd backend
npm install
cp .env.example .env  # .envを編集してMONGODB_URIを設定
npm run dev
```

### フロントエンド
```bash
cd frontend
npm install
# .envは既に設定済み (NUXT_PUBLIC_API_URL=http://localhost:5000)
npm run dev
```

## 📦 技術スタック
- **Backend:** Node.js, Express, Socket.IO, MongoDB (Mongoose)
- **Frontend:** Nuxt 3, Vue 3, Tailwind CSS
- **Database:** MongoDB Atlas
- **Hosting:** Render

## 🎮 機能
- AI対戦
- 対人戦（Socket.IO）
- モンスター・技の管理画面
- 複合タイプ、状態異常、能力変化
- とんぼ返り、分身、注射などの特殊技
