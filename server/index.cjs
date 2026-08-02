const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// ── Config ──
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'chasr_secret_' + uuidv4();
const BCRYPT_ROUNDS = 12;

// ── Database ──
const DATA_DIR = process.env.DATA_DIR || __dirname;
const db = new Database(process.env.DB_PATH || path.join(DATA_DIR, 'chasr.db'));
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT DEFAULT '',
    age INTEGER DEFAULT 18,
    pronouns TEXT DEFAULT '',
    identity TEXT DEFAULT '',
    tagline TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    photos TEXT DEFAULT '[]',
    height TEXT DEFAULT '',
    body_type TEXT DEFAULT '',
    ethnicity TEXT DEFAULT '',
    looking_for TEXT DEFAULT '[]',
    interests TEXT DEFAULT '[]',
    verified INTEGER DEFAULT 0,
    lat REAL DEFAULT 40.7306,
    lng REAL DEFAULT -73.9866,
    location_sharing INTEGER DEFAULT 1,
    joined_at INTEGER NOT NULL,
    last_active INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blocks (
    user_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, target_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    last_message TEXT DEFAULT '',
    last_message_at INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_chats_user1 ON chats(user1_id);
  CREATE INDEX IF NOT EXISTS idx_chats_user2 ON chats(user2_id);
  CREATE INDEX IF NOT EXISTS idx_users_location ON users(lat, lng);
`);

// ── Express + Socket.io ──
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOADS_PATH || path.join(DATA_DIR, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + uuidv4().slice(0, 8) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const uploadsDir = process.env.UPLOADS_PATH || path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ── Auth Middleware ──
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Health ──
app.get('/api/health', (req, res) => res.json({ ok: true, uptime: Math.floor(process.uptime()) }));

// ── Auth Routes ──
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(400).json({ error: 'Account already exists' });

    const id = 'user_' + Date.now() + '_' + uuidv4().slice(0, 8);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = Date.now();

    db.prepare(`INSERT INTO users (id, email, password_hash, joined_at, last_active) VALUES (?, ?, ?, ?, ?)`)
      .run(id, email.toLowerCase(), passwordHash, now, now);

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id, email: email.toLowerCase(), name: '', age: 18 } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(400).json({ error: 'No account found with this email' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Incorrect password' });

    db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(Date.now(), user.id);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Profile Routes ──
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

app.put('/api/profile', authMiddleware, (req, res) => {
  const { name, age, pronouns, identity, tagline, bio, height, body_type, ethnicity, looking_for, interests, lat, lng, location_sharing } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updates = [];
  const values = [];
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (age !== undefined) { updates.push('age = ?'); values.push(age); }
  if (pronouns !== undefined) { updates.push('pronouns = ?'); values.push(pronouns); }
  if (identity !== undefined) { updates.push('identity = ?'); values.push(identity); }
  if (tagline !== undefined) { updates.push('tagline = ?'); values.push(tagline); }
  if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
  if (height !== undefined) { updates.push('height = ?'); values.push(height); }
  if (body_type !== undefined) { updates.push('body_type = ?'); values.push(body_type); }
  if (ethnicity !== undefined) { updates.push('ethnicity = ?'); values.push(ethnicity); }
  if (looking_for !== undefined) { updates.push('looking_for = ?'); values.push(JSON.stringify(looking_for)); }
  if (interests !== undefined) { updates.push('interests = ?'); values.push(JSON.stringify(interests)); }
  if (lat !== undefined) { updates.push('lat = ?'); values.push(lat); }
  if (lng !== undefined) { updates.push('lng = ?'); values.push(lng); }
  if (location_sharing !== undefined) { updates.push('location_sharing = ?'); values.push(location_sharing ? 1 : 0); }
  updates.push('last_active = ?');
  values.push(Date.now());
  values.push(req.userId);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const { password_hash, ...safeUser } = updated;
  res.json(safeUser);
});

// ── Upload Photos ──
app.post('/api/photos', authMiddleware, upload.array('photos', 9), (req, res) => {
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  const user = db.prepare('SELECT photos FROM users WHERE id = ?').get(req.userId);
  const existing = JSON.parse(user.photos || '[]');
  const updated = [...existing, ...urls].slice(0, 9);
  db.prepare('UPDATE users SET photos = ? WHERE id = ?').run(JSON.stringify(updated), req.userId);
  res.json({ photos: updated });
});

// ── Browse / Discover ──
app.get('/api/profiles', authMiddleware, (req, res) => {
  const { lat, lng, online, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // Get blocked IDs
  const blocked = db.prepare('SELECT target_id FROM blocks WHERE user_id = ?').all(req.userId).map(r => r.target_id);
  const blockedBy = db.prepare('SELECT user_id FROM blocks WHERE target_id = ?').all(req.userId).map(r => r.user_id);
  const allBlocked = [...new Set([...blocked, ...blockedBy, req.userId])];

  let where = `id NOT IN (${allBlocked.map(() => '?').join(',')})`;
  let params = [...allBlocked];

  if (online === 'true') {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    where += ' AND last_active > ?';
    params.push(fiveMinAgo);
  }

  if (search) {
    where += ' AND (name LIKE ? OR identity LIKE ? OR tagline LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const profiles = db.prepare(`SELECT * FROM users WHERE ${where} ORDER BY last_active DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(limit), Number(offset));

  const safe = profiles.map(({ password_hash, ...p }) => ({
    ...p,
    photos: JSON.parse(p.photos || '[]'),
    looking_for: JSON.parse(p.looking_for || '[]'),
    interests: JSON.parse(p.interests || '[]'),
  }));

  res.json({ profiles: safe, total: profiles.length });
});

// ── Nearby (location-based) ──
app.get('/api/nearby', authMiddleware, (req, res) => {
  const { lat, lng, radius = 50 } = req.query;
  const userLat = parseFloat(lat) || 40.7306;
  const userLng = parseFloat(lng) || -73.9866;

  const blocked = db.prepare('SELECT target_id FROM blocks WHERE user_id = ?').all(req.userId).map(r => r.target_id);
  const blockedBy = db.prepare('SELECT user_id FROM blocks WHERE target_id = ?').all(req.userId).map(r => r.user_id);
  const allBlocked = [...new Set([...blocked, ...blockedBy, req.userId])];

  // Simple bounding box (approximate)
  const latDelta = radius / 111;
  const lngDelta = radius / (111 * Math.cos(userLat * Math.PI / 180));

  const profiles = db.prepare(`
    SELECT *, 
      ((lat - ?) * (lat - ?) + (lng - ?) * (lng - ?)) as dist_sq
    FROM users
    WHERE id NOT IN (${allBlocked.map(() => '?').join(',')})
      AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
      AND location_sharing = 1
    ORDER BY dist_sq ASC
    LIMIT 100
  `).all(userLat, userLat, userLng, userLng, ...allBlocked,
    userLat - latDelta, userLat + latDelta, userLng - lngDelta, userLng + lngDelta);

  const safe = profiles.map(({ password_hash, dist_sq, ...p }) => ({
    ...p,
    photos: JSON.parse(p.photos || '[]'),
    looking_for: JSON.parse(p.looking_for || '[]'),
    interests: JSON.parse(p.interests || '[]'),
    distance_km: Math.sqrt(dist_sq) * 111,
  }));

  res.json({ profiles: safe });
});

// ── Favorites ──
app.post('/api/favorites/:targetId', authMiddleware, (req, res) => {
  const { targetId } = req.params;
  const now = Date.now();

  // Check if already favorited
  const existing = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND target_id = ?').get(req.userId, targetId);
  if (existing) return res.json({ status: 'already_favorited' });

  db.prepare('INSERT INTO favorites (user_id, target_id, created_at) VALUES (?, ?, ?)').run(req.userId, targetId, now);

  // Check for mutual favorite (match)
  const mutual = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND target_id = ?').get(targetId, req.userId);
  const isMatch = !!mutual;

  // Create chat if match
  let chatId = null;
  if (isMatch) {
    const existingChat = db.prepare(
      'SELECT id FROM chats WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)'
    ).get(req.userId, targetId, targetId, req.userId);

    if (existingChat) {
      chatId = existingChat.id;
    } else {
      chatId = 'chat_' + uuidv4().slice(0, 12);
      db.prepare('INSERT INTO chats (id, user1_id, user2_id, created_at) VALUES (?, ?, ?, ?)')
        .run(chatId, req.userId, targetId, now);
    }

    // System message
    db.prepare('INSERT INTO messages (id, chat_id, sender_id, text, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('msg_' + uuidv4().slice(0, 12), chatId, 'system', '🎉 It\'s a match! Say hello!', now);

    // Notify via socket
    io.to(`user_${targetId}`).emit('match', { from: req.userId, chatId });
  }

  res.json({ isMatch, chatId });
});

app.delete('/api/favorites/:targetId', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND target_id = ?').run(req.userId, req.params.targetId);
  res.json({ status: 'removed' });
});

app.get('/api/favorites', authMiddleware, (req, res) => {
  const favs = db.prepare(`
    SELECT u.*, f.created_at as favorited_at FROM favorites f
    JOIN users u ON f.target_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.userId);

  const me = db.prepare('SELECT id FROM users WHERE id = ?').get(req.userId);
  const myFavIds = db.prepare('SELECT target_id FROM favorites WHERE user_id = ?').all(req.userId).map(r => r.target_id);

  const safe = favs.map(({ password_hash, ...u }) => ({
    ...u,
    photos: JSON.parse(u.photos || '[]'),
    looking_for: JSON.parse(u.looking_for || '[]'),
    interests: JSON.parse(u.interests || '[]'),
    isMatch: myFavIds.includes(u.id) && db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND target_id = ?').get(u.id, req.userId),
  }));

  res.json({ favorites: safe });
});

// ── Blocks ──
app.post('/api/blocks/:targetId', authMiddleware, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO blocks (user_id, target_id, created_at) VALUES (?, ?, ?)')
    .run(req.userId, req.params.targetId, Date.now());
  res.json({ status: 'blocked' });
});

// ── Chats ──
app.get('/api/chats', authMiddleware, (req, res) => {
  const chats = db.prepare(`
    SELECT c.*, 
      CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_id
    FROM chats c
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY c.last_message_at DESC
  `).all(req.userId, req.userId, req.userId);

  const result = chats.map(chat => {
    const other = db.prepare('SELECT id, name, age, photos, pronouns, identity, last_active FROM users WHERE id = ?')
      .get(chat.other_id);
    const unread = db.prepare('SELECT COUNT(*) as count FROM messages WHERE chat_id = ? AND sender_id != ? AND read = 0')
      .get(chat.id, req.userId);

    return {
      ...chat,
      photos: other ? JSON.parse(other.photos || '[]') : [],
      other_user: other ? { ...other, photos: JSON.parse(other.photos || '[]') } : null,
      unread_count: unread.count,
    };
  });

  res.json({ chats: result });
});

// ── Messages ──
app.get('/api/chats/:chatId/messages', authMiddleware, (req, res) => {
  const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)')
    .get(req.params.chatId, req.userId, req.userId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  // Mark as read
  db.prepare('UPDATE messages SET read = 1 WHERE chat_id = ? AND sender_id != ?').run(req.params.chatId, req.userId);

  const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC')
    .all(req.params.chatId);

  res.json({ messages });
});

app.post('/api/chats/:chatId/messages', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Message text required' });

  const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)')
    .get(req.params.chatId, req.userId, req.userId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  const msgId = 'msg_' + uuidv4().slice(0, 12);
  const now = Date.now();
  db.prepare('INSERT INTO messages (id, chat_id, sender_id, text, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(msgId, req.params.chatId, req.userId, text.trim(), now);

  db.prepare('UPDATE chats SET last_message = ?, last_message_at = ? WHERE id = ?')
    .run(text.trim().slice(0, 100), now, req.params.chatId);

  const msg = { id: msgId, chat_id: req.params.chatId, sender_id: req.userId, text: text.trim(), read: 0, created_at: now };

  // Emit to other user
  const otherId = chat.user1_id === req.userId ? chat.user2_id : chat.user1_id;
  io.to(`user_${otherId}`).emit('message', msg);


  res.json({ message: msg });
});

// ── Online Users ──
app.get('/api/online', authMiddleware, (req, res) => {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const blocked = db.prepare('SELECT target_id FROM blocks WHERE user_id = ?').all(req.userId).map(r => r.target_id);
  const allBlocked = [...blocked, req.userId];

  const online = db.prepare(`SELECT * FROM users WHERE last_active > ? AND id NOT IN (${allBlocked.map(() => '?').join(',')}) ORDER BY last_active DESC`)
    .all(fiveMinAgo, ...allBlocked);

  const safe = online.map(({ password_hash, ...u }) => ({
    ...u,
    photos: JSON.parse(u.photos || '[]'),
    looking_for: JSON.parse(u.looking_for || '[]'),
    interests: JSON.parse(u.interests || '[]'),
  }));

  res.json({ profiles: safe });
});

// ── Socket.io ──
io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return socket.disconnect();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    socket.join(`user_${userId}`);
    db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(Date.now(), userId);

    socket.on('typing', ({ chatId }) => {
      const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)').get(chatId, userId, userId);
      if (chat) {
        const otherId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        io.to(`user_${otherId}`).emit('typing', { chatId, userId });
      }
    });

    socket.on('disconnect', () => {
      db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(Date.now(), userId);
    });
  } catch {
    socket.disconnect();
  }
});

// ── Serve static frontend in production ──
app.use(express.static(path.join(__dirname, '../dist')));
app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) return;
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ── Start ──
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Chasr Dating server running on port ${PORT}`);
});
