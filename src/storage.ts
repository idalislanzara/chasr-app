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
const DEMO_PROFILES: Array<{
  id: string; name: string; age: number; pronouns: string; identity: string;
  tagline: string; bio: string; distance: string; lastActive: string; verified: boolean;
  online: boolean; lat: number; lng: number; photos: string[]; height: string;
  bodyType: string; ethnicity: string; lookingFor: string[]; interests: string[];
}> = [
  { id: 'p1', name: 'Zara', age: 29, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Live laugh lip sync', bio: 'City girl with a country heart. I host the best brunch parties in Brooklyn and I make a mean mimosa. Looking for someone who can keep up with my energy.', distance: '1.9 mi', lastActive: '5m ago', verified: true, online: true, lat: 40.7574, lng: -73.9679, photos: ['https://randomuser.me/api/portraits/women/44.jpg', 'https://randomuser.me/api/portraits/women/68.jpg'], height: "5'6''", bodyType: 'Curvy', ethnicity: 'Mixed', lookingFor: ['Dates', 'Friends', 'Chat'], interests: ['Cosplay', 'Fashion', 'Writing', 'Dancing', 'Brunch'] },
  { id: 'p2', name: 'Maya', age: 28, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Soft boi energy', bio: 'Introverted extrovert. I will adopt every stray cat I see. Currently learning to cook Thai food and binge-watching anime.', distance: '0.7 mi', lastActive: '2m ago', verified: true, online: true, lat: 40.7614, lng: -73.9776, photos: ['https://randomuser.me/api/portraits/women/65.jpg', 'https://randomuser.me/api/portraits/women/22.jpg'], height: "5'4''", bodyType: 'Slim', ethnicity: 'Hispanic/Latina', lookingFor: ['Relationship', 'Chat'], interests: ['Coffee', 'Cats', 'Reading', 'Art', 'Movies'] },
  { id: 'p3', name: 'Nyx', age: 30, pronouns: 'she/they', identity: 'Non-Binary', tagline: 'Chaotic good', bio: 'Tattooed librarian by day, DJ by night. Ask me about my vinyl collection. I have strong opinions about fonts.', distance: '3.2 mi', lastActive: '15m ago', verified: false, online: false, lat: 40.7484, lng: -73.9857, photos: ['https://randomuser.me/api/portraits/women/90.jpg', 'https://randomuser.me/api/portraits/women/33.jpg'], height: "5'9''", bodyType: 'Athletic', ethnicity: 'Asian', lookingFor: ['Friends', 'Right Now'], interests: ['Music', 'Tattoos', 'Gaming', 'Cooking', 'Hiking'] },
  { id: 'p4', name: 'Aria', age: 31, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Bougie on a budget', bio: 'I make terrible puns and I am not sorry. Brunch is my love language. Will trade recipes for compliments.', distance: '1.1 mi', lastActive: 'Just now', verified: true, online: true, lat: 40.758, lng: -73.9855, photos: ['https://randomuser.me/api/portraits/women/55.jpg', 'https://randomuser.me/api/portraits/women/26.jpg'], height: "5'7''", bodyType: 'Average', ethnicity: 'Black', lookingFor: ['Dates', 'Relationship'], interests: ['Foodie', 'Fashion', 'Travel', 'Photography', 'Parties'] },
  { id: 'p5', name: 'Dakota', age: 27, pronouns: 'he/him', identity: 'Trans Man', tagline: 'Gym rat with a bookshelf', bio: 'Fitness is my therapy. Also reading sci-fi novels at 2 AM. I can deadlift twice my bodyweight but I cry at dog videos.', distance: '2.5 mi', lastActive: '30m ago', verified: true, online: false, lat: 40.742, lng: -73.989, photos: ['https://randomuser.me/api/portraits/men/32.jpg', 'https://randomuser.me/api/portraits/men/52.jpg'], height: "5'10''", bodyType: 'Muscular', ethnicity: 'White', lookingFor: ['Dates', 'Friends', 'Right Now'], interests: ['Fitness', 'Reading', 'Cooking', 'Gaming', 'Hiking'] },
  { id: 'p6', name: 'Luna', age: 26, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Disco queen', bio: 'If there is a dance floor, I am on it. I make the best margaritas in the tri-state area. Challenge me.', distance: '0.3 mi', lastActive: 'Just now', verified: true, online: true, lat: 40.7505, lng: -73.9934, photos: ['https://randomuser.me/api/portraits/women/41.jpg', 'https://randomuser.me/api/portraits/women/25.jpg'], height: "5'5''", bodyType: 'Petite', ethnicity: 'Mixed', lookingFor: ['Chat', 'Right Now', 'Friends'], interests: ['Dancing', 'Music', 'Karaoke', 'Foodie', 'Fashion'] },
  { id: 'p7', name: 'River', age: 27, pronouns: 'they/them', identity: 'Genderqueer', tagline: 'Plant parent extraordinaire', bio: 'I have 47 plants and I know all their names. No I will not apologize. Also I make ceramic mugs as a side hustle.', distance: '4.1 mi', lastActive: '1h ago', verified: false, online: false, lat: 40.735, lng: -73.99, photos: ['https://randomuser.me/api/portraits/women/60.jpg', 'https://randomuser.me/api/portraits/women/36.jpg'], height: "5'3''", bodyType: 'Slim', ethnicity: 'Pacific Islander', lookingFor: ['Friends', 'Chat', 'Networking'], interests: ['Yoga', 'Cooking', 'Art', 'Reading', 'Photography'] },
  { id: 'p8', name: 'Jade', age: 30, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Sarcastic sweetheart', bio: 'Will trade baked goods for good conversation. Dog mom to a very spoiled pomeranian named Sir Biscuit.', distance: '1.8 mi', lastActive: '10m ago', verified: true, online: true, lat: 40.765, lng: -73.975, photos: ['https://randomuser.me/api/portraits/women/48.jpg', 'https://randomuser.me/api/portraits/women/38.jpg'], height: "5'8''", bodyType: 'Curvy', ethnicity: 'Middle Eastern', lookingFor: ['Dates', 'Relationship'], interests: ['Cooking', 'Dogs', 'Movies', 'Travel', 'Brunch'] },
  { id: 'p9', name: 'Kai', age: 28, pronouns: 'he/him', identity: 'Trans Man', tagline: 'Skater boy turned tech bro', bio: 'Building apps by day, skating by night. Currently learning guitar. I make playlists for every mood.', distance: '5.0 mi', lastActive: '45m ago', verified: false, online: false, lat: 40.728, lng: -73.995, photos: ['https://randomuser.me/api/portraits/men/53.jpg', 'https://randomuser.me/api/portraits/men/61.jpg'], height: "6'0''", bodyType: 'Athletic', ethnicity: 'Asian', lookingFor: ['Friends', 'Dates', 'Networking'], interests: ['Tech', 'Gaming', 'Music', 'Fitness', 'Coffee'] },
  { id: 'p10', name: 'Serena', age: 32, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Pageant queen in training', bio: 'Confidence is my superpower. I speak three languages and count sarcasm as a fourth. Looking for someone who can match my energy.', distance: '2.2 mi', lastActive: '5m ago', verified: true, online: true, lat: 40.754, lng: -73.98, photos: ['https://randomuser.me/api/portraits/women/49.jpg', 'https://randomuser.me/api/portraits/women/30.jpg'], height: "5'11''", bodyType: 'Athletic', ethnicity: 'Hispanic/Latina', lookingFor: ['Dates', 'Relationship', 'Friends'], interests: ['Fashion', 'Dancing', 'Travel', 'Parties', 'Cosplay'] },
  { id: 'p11', name: 'Phoenix', age: 25, pronouns: 'ze/zir', identity: 'Agender', tagline: 'Cosmic chaos gremlin', bio: 'Non-binary nerd who lives for anime conventions and iced coffee. Currently learning Japanese so I can watch anime without subtitles.', distance: '3.7 mi', lastActive: '20m ago', verified: false, online: true, lat: 40.74, lng: -73.982, photos: ['https://randomuser.me/api/portraits/women/56.jpg', 'https://randomuser.me/api/portraits/women/29.jpg'], height: "5'2''", bodyType: 'Petite', ethnicity: 'White', lookingFor: ['Chat', 'Friends'], interests: ['Anime', 'Gaming', 'Cosplay', 'Art', 'Coffee'] },
  { id: 'p12', name: 'Mika', age: 28, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Vogue or die trying', bio: 'Ballroom scene veteran. I will teach you to walk if you teach me to cook. Legendary brunch guest.', distance: '1.5 mi', lastActive: 'Just now', verified: true, online: true, lat: 40.752, lng: -73.987, photos: ['https://randomuser.me/api/portraits/women/39.jpg', 'https://randomuser.me/api/portraits/women/43.jpg'], height: "5'7''", bodyType: 'Curvy', ethnicity: 'Black', lookingFor: ['Right Now', 'Chat', 'Friends'], interests: ['Dancing', 'Fashion', 'Cooking', 'Music', 'Parties'] },
  { id: 'p13', name: 'Cameron', age: 26, pronouns: 'he/him', identity: 'Trans Man', tagline: 'Coffee snob and proud', bio: 'I have opinions about pour-over ratios and I am not afraid to share them. Also a recovering workaholic learning to relax.', distance: '0.9 mi', lastActive: '8m ago', verified: true, online: true, lat: 40.756, lng: -73.984, photos: ['https://randomuser.me/api/portraits/men/59.jpg', 'https://randomuser.me/api/portraits/men/51.jpg'], height: "5'9''", bodyType: 'Average', ethnicity: 'White', lookingFor: ['Dates', 'Chat'], interests: ['Coffee', 'Travel', 'Photography', 'Cooking', 'Hiking'] },
  { id: 'p14', name: 'Dahlia', age: 35, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Mama bear vibes', bio: 'Two kids, one ex, zero regrets. Looking for someone who gets it. I make the best Sunday dinner you have ever had.', distance: '6.3 mi', lastActive: '2h ago', verified: false, online: false, lat: 40.72, lng: -74.005, photos: ['https://randomuser.me/api/portraits/women/46.jpg', 'https://randomuser.me/api/portraits/women/35.jpg'], height: "5'5''", bodyType: 'Full-figured', ethnicity: 'Black', lookingFor: ['Relationship', 'Friends'], interests: ['Cooking', 'Reading', 'Dogs', 'Travel', 'Movies'] },
  { id: 'p15', name: 'Reese', age: 25, pronouns: 'he/they', identity: 'Trans Man', tagline: 'Chaos energy', bio: 'I am either your best friend or your worst nightmare. There is no in between. Also I can solve a Rubik cube in under a minute.', distance: '2.8 mi', lastActive: '12m ago', verified: false, online: true, lat: 40.745, lng: -73.978, photos: ['https://randomuser.me/api/portraits/men/62.jpg', 'https://randomuser.me/api/portraits/men/54.jpg'], height: "5'8''", bodyType: 'Slim', ethnicity: 'Mixed', lookingFor: ['Right Now', 'Chat'], interests: ['Gaming', 'Music', 'Tattoos', 'Anime', 'Parties'] },
  { id: 'p16', name: 'Valentina', age: 27, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Sunshine with an edge', bio: 'I smile a lot but I will also throw hands. Tattoo artist by trade, poet by night. My ink tells stories.', distance: '1.3 mi', lastActive: '3m ago', verified: true, online: true, lat: 40.759, lng: -73.991, photos: ['https://randomuser.me/api/portraits/women/37.jpg', 'https://randomuser.me/api/portraits/women/28.jpg'], height: "5'6''", bodyType: 'Athletic', ethnicity: 'Hispanic/Latina', lookingFor: ['Dates', 'Friends', 'Right Now'], interests: ['Tattoos', 'Art', 'Music', 'Dancing', 'Coffee'] },
  { id: 'p17', name: 'Elliot', age: 29, pronouns: 'he/him', identity: 'Trans Man', tagline: 'Board game collector', bio: 'I own 200+ board games and I will absolutely destroy you at Catan. Also a decent home cook.', distance: '4.5 mi', lastActive: '1h ago', verified: true, online: false, lat: 40.732, lng: -73.97, photos: ['https://randomuser.me/api/portraits/men/64.jpg', 'https://randomuser.me/api/portraits/men/55.jpg'], height: "5'11''", bodyType: 'Average', ethnicity: 'White', lookingFor: ['Friends', 'Dates', 'Networking'], interests: ['Gaming', 'Cooking', 'Reading', 'Hiking', 'Tech'] },
  { id: 'p18', name: 'Amara', age: 25, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Soft life only', bio: 'Skincare routine takes 45 minutes and I am not sorry. Also I knit scarves for my friends cats.', distance: '2.0 mi', lastActive: '7m ago', verified: false, online: true, lat: 40.751, lng: -73.983, photos: ['https://randomuser.me/api/portraits/women/40.jpg', 'https://randomuser.me/api/portraits/women/34.jpg'], height: "5'4''", bodyType: 'Petite', ethnicity: 'Black', lookingFor: ['Chat', 'Friends'], interests: ['Yoga', 'Coffee', 'Fashion', 'Art', 'Brunch'] },
  { id: 'p19', name: 'Sage', age: 30, pronouns: 'they/them', identity: 'Genderfluid', tagline: 'Mercury is in retrograde and so am I', bio: 'Astrologer, tarot reader, and professional over-thinker. Ask me your sign and I will tell you about yourself.', distance: '3.0 mi', lastActive: '25m ago', verified: true, online: false, lat: 40.744, lng: -73.996, photos: ['https://randomuser.me/api/portraits/women/50.jpg', 'https://randomuser.me/api/portraits/women/31.jpg'], height: "5'6''", bodyType: 'Average', ethnicity: 'Mixed', lookingFor: ['Chat', 'Friends', 'Networking'], interests: ['Yoga', 'Art', 'Reading', 'Coffee', 'Music'] },
  { id: 'p20', name: 'Marco', age: 33, pronouns: 'he/him', identity: 'Trans Man', tagline: 'Chef who cannot cook', bio: 'I work in a restaurant but I eat cereal for dinner. Life is complicated. Also I have a pet iguana named Steve.', distance: '5.5 mi', lastActive: '40m ago', verified: true, online: false, lat: 40.725, lng: -74.0, photos: ['https://randomuser.me/api/portraits/men/63.jpg', 'https://randomuser.me/api/portraits/men/58.jpg'], height: "6'1''", bodyType: 'Muscular', ethnicity: 'Hispanic/Latina', lookingFor: ['Dates', 'Relationship'], interests: ['Foodie', 'Music', 'Fitness', 'Travel', 'Parties'] },
  { id: 'p21', name: 'Kiki', age: 25, pronouns: 'she/her', identity: 'Trans Woman', tagline: 'Main character energy', bio: 'Yes I am that girl. Makeup artist, aspiring drag queen, and professional drama starter. But like, the fun kind.', distance: '1.0 mi', lastActive: 'Just now', verified: true, online: true, lat: 40.753, lng: -73.988, photos: ['https://randomuser.me/api/portraits/women/42.jpg', 'https://randomuser.me/api/portraits/women/27.jpg'], height: "5'3''", bodyType: 'Slim', ethnicity: 'Asian', lookingFor: ['Chat', 'Friends', 'Right Now'], interests: ['Fashion', 'Makeup', 'Dancing', 'Parties', 'Photography'] },
  { id: 'p22', name: 'Tobias', age: 28, pronouns: 'he/him', identity: 'Trans Man', tagline: 'Dad jokes but make it queer', bio: 'I am puns personified. Also a park ranger on weekends. If you like dogs we will get along.', distance: '3.8 mi', lastActive: '18m ago', verified: false, online: true, lat: 40.738, lng: -73.975, photos: ['https://randomuser.me/api/portraits/men/66.jpg', 'https://randomuser.me/api/portraits/men/50.jpg'], height: "6'2''", bodyType: 'Athletic', ethnicity: 'White', lookingFor: ['Dates', 'Relationship'], interests: ['Hiking', 'Dogs', 'Cooking', 'Camping', 'Photography'] },
  { id: 'p23', name: 'Blair', age: 26, pronouns: 'she/they', identity: 'Trans Woman', tagline: 'Cottagecore meets club kid', bio: 'I knit my own clothes and then wear them to raves. I am a walking contradiction and I love it.', distance: '2.4 mi', lastActive: '14m ago', verified: true, online: false, lat: 40.747, lng: -73.992, photos: ['https://randomuser.me/api/portraits/women/39.jpg', 'https://randomuser.me/api/portraits/women/24.jpg'], height: "5'7''", bodyType: 'Average', ethnicity: 'White', lookingFor: ['Friends', 'Chat', 'Dates'], interests: ['Knitting', 'Music', 'Art', 'Nature', 'Coffee'] },
  { id: 'p24', name: 'Jaxon', age: 25, pronouns: 'he/him', identity: 'Trans Man', tagline: 'Tattooed twink with ambition', bio: 'Software engineer by trade, musician by passion. I write songs about my exes. They will never hear them.', distance: '4.0 mi', lastActive: '35m ago', verified: false, online: false, lat: 40.731, lng: -73.985, photos: ['https://randomuser.me/api/portraits/men/65.jpg', 'https://randomuser.me/api/portraits/men/48.jpg'], height: "5'10''", bodyType: 'Slim', ethnicity: 'Mixed', lookingFor: ['Dates', 'Friends'], interests: ['Music', 'Tech', 'Gaming', 'Tattoos', 'Coffee'] },
];

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

function ensureDemoProfiles() {
  const existing = dbGet<StoredUser[]>('users', []);
  if (existing.length > 0) return;
  const demoUsers: StoredUser[] = DEMO_PROFILES.map(p => ({
    id: p.id,
    email: `demo_${p.id}@chasr.app`,
    passwordHash: '',
    passwordSalt: '',
    name: p.name,
    age: p.age,
    pronouns: p.pronouns,
    identity: p.identity,
    tagline: p.tagline,
    bio: p.bio,
    photos: p.photos,
    height: p.height,
    body_type: p.bodyType,
    ethnicity: p.ethnicity,
    looking_for: p.lookingFor,
    interests: p.interests,
    verified: p.verified,
    lat: p.lat,
    lng: p.lng,
    location_sharing: true,
    joined_at: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    last_active: p.online ? Date.now() - Math.floor(Math.random() * 600000) : Date.now() - Math.floor(Math.random() * 86400000),
  }));
  dbSet('users', demoUsers);
}

ensureDemoProfiles();

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

export function localSeed() {
  ensureDemoProfiles();
  return { ok: true, count: DEMO_PROFILES.length };
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
