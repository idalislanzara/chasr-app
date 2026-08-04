// Storage that never crashes the app.
// Some in-app browsers (Instagram, TikTok, Discord, Snapchat) block localStorage,
// which used to freeze the app on the age gate. If storage is blocked, we fall
// back to in-memory storage so the app still works for that session.

function probe(): Storage | null {
  try {
    const s = window.localStorage;
    const k = '__chasr_probe__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

let store: Storage | null = probe();
const mem = new Map<string, string>();

export function safeGet(key: string): string | null {
  try {
    if (store) return store.getItem(key);
  } catch {}
  return mem.has(key) ? mem.get(key)! : null;
}

export function safeSet(key: string, value: string): void {
  try {
    if (store) {
      store.setItem(key, value);
      return;
    }
  } catch {}
  mem.set(key, value);
}

export function safeRemove(key: string): void {
  try {
    if (store) {
      store.removeItem(key);
      return;
    }
  } catch {}
  mem.delete(key);
}
