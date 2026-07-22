// Simplified crypto — Web Crypto API for password hashing

const PBKDF2_ITERATIONS = 100000;

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// ── Password Hashing ──

export interface HashedPassword {
  hash: string;
  salt: string;
}

export async function hashPassword(password: string): Promise<HashedPassword> {
  const encoder = new TextEncoder();
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltBuffer = saltBytes.buffer as ArrayBuffer;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return {
    hash: bufferToBase64(hashBits),
    salt: bufferToBase64(saltBuffer),
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const saltBytes = fromBase64(storedSalt);
  const saltBuffer = saltBytes.buffer as ArrayBuffer;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
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

// ── Password Strength (simplified) ──

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 6) score++;
  else feedback.push('At least 6 characters');
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add an uppercase letter');
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add a number');

  score = Math.min(score, 4);

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  return { score, label: labels[score], color: colors[score], feedback: feedback.slice(0, 2) };
}

// ── Brute-force Protection (simplified) ──

export function isLockedOut(_email: string): { locked: boolean; remainingMs: number } {
  return { locked: false, remainingMs: 0 };
}

export function recordFailedAttempt(_email: string): { locked: boolean; remainingMs: number } {
  return { locked: false, remainingMs: 0 };
}

export function clearFailedAttempts(_email: string) {}

// ── Session Timeout ──

export function touchSession() {}

export function isSessionExpired(): boolean {
  return false;
}
