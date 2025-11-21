const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectDB = require('./src/config/database');

// Load environment variables
dotenv.config();
console.log('Server starting with LATEST updated code - timestamp:', new Date().toISOString());

// ログファイルの設定
const LOG_FILE = path.join(__dirname, 'server.log');
const MAX_LOG_LINES = 500;
const logBuffer = [];

// console.logをオーバーライドしてログファイルに保存
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] LOG: ${message}`;
  
  // 元のconsole.logを呼び出し
  originalLog.apply(console, args);
  
  // バッファに追加
  logBuffer.push(logLine);
  if (logBuffer.length > MAX_LOG_LINES) {
    logBuffer.shift(); // 古いログを削除
  }
  
  // ファイルに書き込み
  writeLogsToFile();
};

console.error = function(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ERROR: ${message}`;
  
  // 元のconsole.errorを呼び出し
  originalError.apply(console, args);
  
  // バッファに追加
  logBuffer.push(logLine);
  if (logBuffer.length > MAX_LOG_LINES) {
    logBuffer.shift();
  }
  
  // ファイルに書き込み
  writeLogsToFile();
};

function writeLogsToFile() {
  const content = logBuffer.join('\n') + '\n';
  fs.writeFileSync(LOG_FILE, content, 'utf8');
}

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Allow multiple origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://nogamblemonsterbattle-frontend.onrender.com'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Load models (important for populate to work)
require('./src/models/Move');
require('./src/models/Monster');
require('./src/models/Battle');
require('./src/models/Ability');

// Routes
const monsterRoutes = require('./src/routes/monster');
const battleRoutes = require('./src/routes/battle');
const moveRoutes = require('./src/routes/move');
const abilityRoutes = require('./src/routes/ability');

app.use('/api/monster', monsterRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/move', moveRoutes);
app.use('/api/ability', abilityRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: true, message: 'Internal server error' });
});

// Socket.IO マッチングシステム
const matchmakingService = require('./src/services/matchmakingService');
matchmakingService.initialize(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO enabled for PvP battles`);
  console.log(`Ready for matchmaking!`);
});

module.exports = { app, server, io };
