// Client-side cryptographic utilities using Web Crypto API
// Passwords are hashed with PBKDF2-SHA256 + random salt
// User data is encrypted with AES-GCM

const PBKDF2_ITERATIONS = 310000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}


function toBase64Bytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Password Hashing ──

export interface HashedPassword {
  hash: string;
  salt: string;
}

export async function hashPassword(password: string): Promise<HashedPassword> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return {
    hash: bufferToBase64(hashBits),
    salt: toBase64Bytes(salt),
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const salt = fromBase64(storedSalt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  const computedHash = bufferToBase64(hashBits);
  if (computedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

// ── AES-GCM Encryption ──

const ENCRYPTION_KEY_NAME = 'chasr_enc_key';

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const existing = await getStoredKey();
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  await storeKey(key);
  return key;
}

async function getStoredKey(): Promise<CryptoKey | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open('chasr_vault', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('keys'); };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('keys', 'readonly');
      const get = tx.objectStore('keys').get(ENCRYPTION_KEY_NAME);
      get.onsuccess = () => resolve(get.result || null);
      get.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

async function storeKey(key: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('chasr_vault', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('keys'); };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('keys', 'readwrite');
      tx.objectStore('keys').put(key, ENCRYPTION_KEY_NAME);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function encryptData(data: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(data);

  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv } as AesGcmParams,
    key,
    encoded
  );

  const encryptedBytes = new Uint8Array(await encryptedBuf);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, iv.length);
  return toBase64Bytes(combined);
}

export async function decryptData(encryptedBase64: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const combined = fromBase64(encryptedBase64);

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = new Uint8Array(combined.slice(IV_LENGTH)).buffer;

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv } as AesGcmParams,
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuf);
}

// ── Password Strength ──

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else feedback.push('Mix upper and lowercase');
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add a number');
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add a special character');

  score = Math.min(score, 4);

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  const lower = password.toLowerCase();
  if (['password', '123456', 'qwerty', 'letmein', 'changeme', 'admin'].some(c => lower.includes(c))) {
    score = 0;
    feedback.push('Avoid common passwords');
  }
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(score - 1, 0);
    feedback.push('Avoid repeated characters');
  }

  return { score, label: labels[score], color: colors[score], feedback: feedback.slice(0, 2) };
}

// ── Brute-force Protection ──

const ATTEMPTS_KEY = 'chasr_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

interface FailedAttempts { count: number; lastAttempt: number; lockedUntil: number; }

function getFailedAttempts(email: string): FailedAttempts {
  try {
    const raw = localStorage.getItem(`${ATTEMPTS_KEY}_${email}`);
    return raw ? JSON.parse(raw) : { count: 0, lastAttempt: 0, lockedUntil: 0 };
  } catch { return { count: 0, lastAttempt: 0, lockedUntil: 0 }; }
}

function saveFailedAttempts(email: string, data: FailedAttempts) {
  localStorage.setItem(`${ATTEMPTS_KEY}_${email}`, JSON.stringify(data));
}

export function isLockedOut(email: string): { locked: boolean; remainingMs: number } {
  const a = getFailedAttempts(email);
  if (a.lockedUntil > Date.now()) return { locked: true, remainingMs: a.lockedUntil - Date.now() };
  return { locked: false, remainingMs: 0 };
}

export function recordFailedAttempt(email: string): { locked: boolean; remainingMs: number } {
  const a = getFailedAttempts(email);
  const newCount = a.count + 1;
  if (newCount >= MAX_ATTEMPTS) {
    const data = { count: newCount, lastAttempt: Date.now(), lockedUntil: Date.now() + LOCKOUT_DURATION };
    saveFailedAttempts(email, data);
    return { locked: true, remainingMs: LOCKOUT_DURATION };
  }
  const data = { count: newCount, lastAttempt: Date.now(), lockedUntil: 0 };
  saveFailedAttempts(email, data);
  return { locked: false, remainingMs: 0 };
}

export function clearFailedAttempts(email: string) {
  localStorage.removeItem(`${ATTEMPTS_KEY}_${email}`);
}

// ── Session Timeout ──

const SESSION_KEY = 'chasr_session';
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function touchSession() {
  localStorage.setItem(SESSION_KEY, String(Date.now()));
}

export function isSessionExpired(): boolean {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return true;
  return Date.now() - Number(raw) > SESSION_TIMEOUT;
}
