// localStorage-based storage backend for fully offline/standalone operation
import { hashPassword, verifyPassword } from './crypto';

const DB_PREFIX = 'chasr_db_';

function dbGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(DB_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function dbSet(key: string, value: unknown) {
  localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
}

function uuid(): string {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

// ── Demo profiles ──
interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  name: string;
  age: number;
  pronouns: string;
  identity: string;
  tagline: string;
  bio: string;
  photos: string[];
  height: string;
  body_type: string;
  ethnicity: string;
  looking_for: string[];
  interests: string[];
  verified: boolean;
  lat: number;
  lng: number;
  location_sharing: boolean;
  joined_at: number;
  last_active: number;
}

// ── Auth ──

export async function localRegister(email: string, password: string) {
  const users = dbGet<StoredUser[]>('users', []);
  if (users.find(u => u.email === email)) {
    throw new Error('An account already exists with this email');
  }
  const { hash, salt } = await hashPassword(password);
  const user: StoredUser = {
    id: uuid(),
    email,
    passwordHash: hash,
    passwordSalt: salt,
    name: '',
    age: 18,
    pronouns: '',
    identity: '',
    tagline: '',
    bio: '',
    photos: [],
    height: "5'6\"",
    body_type: '',
    ethnicity: '',
    looking_for: [],
    interests: [],
    verified: false,
    lat: 40.7306 + (Math.random() - 0.5) * 0.05,
    lng: -73.9866 + (Math.random() - 0.5) * 0.05,
    location_sharing: true,
    joined_at: Date.now(),
    last_active: Date.now(),
  };
  users.push(user);
  dbSet('users', users);
  const token = btoa(JSON.stringify({ id: user.id, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  return { token, user: sanitizeUser(user) };
}

export async function localLogin(email: string, password: string) {
  const users = dbGet<StoredUser[]>('users', []);
  const user = users.find(u => u.email === email);
  if (!user) throw new Error('No account found with this email');
  if (!user.passwordHash) throw new Error('This account uses social login');
  const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!valid) throw new Error('Incorrect password');
  user.last_active = Date.now();
  dbSet('users', users);
  const token = btoa(JSON.stringify({ id: user.id, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  return { token, user: sanitizeUser(user) };
}

export function localGetMe() {
  const token = localStorage.getItem('chasr_token');
  if (!token) throw new Error('No token');
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) throw new Error('Token expired');
  } catch { throw new Error('Invalid token'); }
  const userId = localStorage.getItem('chasr_user_id');
  const users = dbGet<StoredUser[]>('users', []);
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  user.last_active = Date.now();
  dbSet('users', users);
  return sanitizeUser(user);
}

// ── Profile ──

export function localUpdateProfile(updates: Record<string, unknown>) {
  const userId = localStorage.getItem('chasr_user_id');
  const users = dbGet<StoredUser[]>('users', []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');
  const user = users[idx];
  for (const [key, val] of Object.entries(updates)) {
    if (key === 'photos' && typeof val === 'string') {
      (user as unknown as Record<string, unknown>)[key] = JSON.parse(val);
    } else {
      (user as unknown as Record<string, unknown>)[key] = val;
    }
  }
  user.last_active = Date.now();
  dbSet('users', users);
  return sanitizeUser(user);
}

// ── Browse ──

export function localGetProfiles(params?: { online?: string; search?: string }) {
  const userId = localStorage.getItem('chasr_user_id');
  const users = dbGet<StoredUser[]>('users', []);
  let filtered = users.filter(u => u.id !== userId);
  if (params?.online === 'true') {
    filtered = filtered.filter(u => Date.now() - u.last_active < 5 * 60 * 1000);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.identity.toLowerCase().includes(q) ||
      u.tagline.toLowerCase().includes(q)
    );
  }
  return { profiles: filtered.map(sanitizeUser) };
}

export function localGetNearby(lat: number, lng: number, radius?: number) {
  const userId = localStorage.getItem('chasr_user_id');
  const users = dbGet<StoredUser[]>('users', []);
  const r = radius || 50;
  const nearby = users
    .filter(u => u.id !== userId)
    .map(u => {
      const distKm = Math.sqrt(Math.pow((lat - u.lat) * 111, 2) + Math.pow((lng - u.lng) * 111 * Math.cos(lat * Math.PI / 180), 2));
      return { ...sanitizeUser(u), distance_km: distKm };
    })
    .filter(u => u.distance_km <= r)
    .sort((a, b) => a.distance_km - b.distance_km);
  return { profiles: nearby };
}

// ── Favorites ──

export function localFavorite(targetId: string) {
  const userId = localStorage.getItem('chasr_user_id')!;
  const favs = dbGet<Array<{ user_id: string; target_id: string; created_at: number }>>('favorites', []);
  if (favs.find(f => f.user_id === userId && f.target_id === targetId)) {
    return { isMatch: false };
  }
  favs.push({ user_id: userId, target_id: targetId, created_at: Date.now() });
  dbSet('favorites', favs);
  const isMatch = favs.some(f => f.user_id === targetId && f.target_id === userId);
  return { isMatch };
}

export function localUnfavorite(targetId: string) {
  const userId = localStorage.getItem('chasr_user_id')!;
  let favs = dbGet<Array<{ user_id: string; target_id: string; created_at: number }>>('favorites', []);
  favs = favs.filter(f => !(f.user_id === userId && f.target_id === targetId));
  dbSet('favorites', favs);
  return { ok: true };
}

export function localGetFavorites() {
  const userId = localStorage.getItem('chasr_user_id')!;
  const favs = dbGet<Array<{ user_id: string; target_id: string; created_at: number }>>('favorites', []);
  const users = dbGet<StoredUser[]>('users', []);
  const myFavs = favs.filter(f => f.user_id === userId);
  const favorites = myFavs.map(f => {
    const user = users.find(u => u.id === f.target_id);
    if (!user) return null;
    const isMatch = favs.some(ff => ff.user_id === f.target_id && ff.target_id === userId);
    return { ...sanitizeUser(user), isMatch };
  }).filter(Boolean);
  return { favorites };
}

// ── Blocks ──

export function localBlock(targetId: string) {
  const userId = localStorage.getItem('chasr_user_id')!;
  const blocks = dbGet<Array<{ user_id: string; target_id: string }>>('blocks', []);
  if (!blocks.find(b => b.user_id === userId && b.target_id === targetId)) {
    blocks.push({ user_id: userId, target_id: targetId });
    dbSet('blocks', blocks);
  }
  return { ok: true };
}

export function localGetPremium() {
  const userId = localStorage.getItem('chasr_user_id')!;
  const users = dbGet<Array<Record<string, unknown>>>('users', []);
  const me = users.find(u => u.id === userId) || {};
  const premiumExpires = Number((me as any).premium_expires_at || 0);
  const inviteCode = String((me as any).invite_code || '');
  return {
    premium: premiumExpires > Date.now(),
    premium_expires_at: premiumExpires,
    invite_code: inviteCode,
    invited_by: String((me as any).invited_by || ''),
    invite_url: `https://chasr-app-1.onrender.com/?invite=${inviteCode}`,
  };
}

export function localGetLikes() {
  const userId = localStorage.getItem('chasr_user_id')!;
  const favorites = dbGet<Array<{ user_id: string; target_id: string }>>('favorites', []);
  const users = dbGet<Array<Record<string, unknown> & { id: string }>>('users', []);
  const likerIds = favorites.filter(f => f.target_id === userId).map(f => f.user_id);
  const profiles = users.filter(u => likerIds.includes(u.id)).map(u => ({ ...u, photos: JSON.parse(String(u.photos || '[]')) }));
  const premium = localGetPremium().premium;
  return { locked: !premium, count: profiles.length, profiles: premium ? profiles : [] };
}

export function localReport(targetId: string, reason: string, details = '') {
  const userId = localStorage.getItem('chasr_user_id')!;
  const reports = dbGet<Array<{ reporter_id: string; target_id: string; reason: string; details: string; created_at: number }>>('reports', []);
  reports.push({ reporter_id: userId, target_id: targetId, reason, details, created_at: Date.now() });
  dbSet('reports', reports);
  return { ok: true };
}

// ── Messages ──

interface StoredMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  read: number;
  created_at: number;
}

const AUTO_REPLIES = [
  "Hey! Thanks for the message 💕",
  "You're so sweet! Tell me more about yourself",
  "I was just thinking about reaching out to you!",
  "What are you up to tonight?",
  "I love your profile! Your vibe is immaculate ✨",
  "How's your day going?",
  "Omg yes! We should totally hang out sometime",
  "I see you have good taste 😉",
  "That's so cool! I've been wanting to try that",
  "You had me at hello 💜",
];

export function localGetChats() {
  const userId = localStorage.getItem('chasr_user_id')!;
  const chats = dbGet<Record<string, { user_id: string; other_id: string; created_at: number }>>('chats', {});
  const messages = dbGet<StoredMessage[]>('messages', []);
  const users = dbGet<StoredUser[]>('users', []);

  const myChats = Object.entries(chats)
    .filter(([, chat]) => chat.user_id === userId || chat.other_id === userId)
    .map(([chatId, chat]) => {
      const otherId = chat.user_id === userId ? chat.other_id : chat.user_id;
      const otherUser = users.find(u => u.id === otherId);
      const chatMessages = messages.filter(m => m.chat_id === chatId);
      const lastMsg = chatMessages.sort((a, b) => b.created_at - a.created_at)[0];
      const unreadCount = chatMessages.filter(m => m.sender_id !== userId && !m.read).length;

      return {
        id: chatId,
        other_id: otherId,
        other_user: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          age: otherUser.age,
          photos: otherUser.photos,
          identity: otherUser.identity,
        } : null,
        last_message: lastMsg?.text || '',
        last_message_at: lastMsg?.created_at || chat.created_at,
        unread_count: unreadCount,
      };
    })
    .sort((a, b) => b.last_message_at - a.last_message_at);

  return { chats: myChats };
}

export function localGetMessages(chatId: string) {
  const messages = dbGet<StoredMessage[]>('messages', []);
  return { messages: messages.filter(m => m.chat_id === chatId).sort((a, b) => a.created_at - b.created_at) };
}

export function localSendMessage(chatId: string, text: string) {
  const userId = localStorage.getItem('chasr_user_id')!;
  const messages = dbGet<StoredMessage[]>('messages', []);
  const msg: StoredMessage = {
    id: uuid(),
    chat_id: chatId,
    sender_id: userId,
    text,
    read: 0,
    created_at: Date.now(),
  };
  messages.push(msg);
  dbSet('messages', messages);

  // Auto-reply from demo user after a delay
  const chats = dbGet<Record<string, { user_id: string; other_id: string }>>('chats', {});
  const chat = chats[chatId];
  if (chat) {
    const otherId = chat.user_id === userId ? chat.other_id : chat.user_id;
    const users = dbGet<StoredUser[]>('users', []);
    const otherUser = users.find(u => u.id === otherId);
    if (otherUser && otherUser.passwordHash === '') {
      setTimeout(() => {
        const msgs = dbGet<StoredMessage[]>('messages', []);
        msgs.push({
          id: uuid(),
          chat_id: chatId,
          sender_id: otherId,
          text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
          read: 0,
          created_at: Date.now(),
        });
        dbSet('messages', msgs);
      }, 1500 + Math.random() * 3000);
    }
  }

  return { message: msg };
}

// ── Online ──

export function localGetOnline() {
  const userId = localStorage.getItem('chasr_user_id');
  const users = dbGet<StoredUser[]>('users', []);
  const online = users
    .filter(u => u.id !== userId && Date.now() - u.last_active < 5 * 60 * 1000)
    .map(sanitizeUser);
  return { profiles: online };
}

// ── Seed ──

export function localDeleteAccount() {
  const userId = localStorage.getItem('chasr_user_id');
  if (!userId) return { ok: true };
  let users = dbGet<StoredUser[]>('users', []);
  users = users.filter(u => u.id !== userId);
  dbSet('users', users);
  localStorage.removeItem('chasr_token');
  localStorage.removeItem('chasr_user_id');
  return { ok: true };
}

// ── Photo upload (data URL based) ──

export async function localUploadPhotos(files: File[]) {
  const userId = localStorage.getItem('chasr_user_id')!;
  const users = dbGet<StoredUser[]>('users', []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  const newPhotos: string[] = [];
  for (const file of files) {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    newPhotos.push(dataUrl);
  }

  users[idx].photos = [...users[idx].photos, ...newPhotos];
  dbSet('users', users);
  return { photos: users[idx].photos };
}

// ── Helpers ──

function sanitizeUser(u: StoredUser) {
  const { passwordHash, passwordSalt, ...rest } = u;
  return rest;
}
