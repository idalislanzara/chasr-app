import * as storage from './storage';

// Empty string = same origin (works on Render). Set VITE_API_URL when hosting the
// frontend somewhere else (e.g. GitHub Pages), which falls back to localStorage.
const API_URL = import.meta.env.VITE_API_URL || '';

let backendAvailable: boolean | null = null;
let lastProbe = 0;
const PROBE_RETRY_MS = 10_000;
// On the live host, a cold start can take ~30-60s. Give same-origin probes room to
// finish so we never silently fall back to phone-only "ghost" accounts.
const PROBE_TIMEOUT_MS = API_URL === '' ? 70_000 : 8_000;

// Probe the real backend, but never lock the session into offline mode for long:
// if a probe fails (e.g. Render cold start), retry on the next call after a short wait.
async function checkBackend(): Promise<boolean> {
  const now = Date.now();
  if (backendAvailable === true || (backendAvailable === false && now - lastProbe < PROBE_RETRY_MS)) {
    return backendAvailable;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timeout);
    // If we get a JSON response (even an auth error), the backend is real
    const text = await res.text();
    JSON.parse(text);
    backendAvailable = true;
    return true;
  } catch {
    backendAvailable = false;
    lastProbe = now;
    return false;
  }
}

async function remoteRequest(path: string, options: RequestInit = {}) {
  const token = safeGet('chasr_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data: any = {};
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const err = new Error((data && typeof data.error === 'string' ? data.error : '') || `Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: async (email: string, password: string, inviteCode?: string) => {
    if (await checkBackend()) return remoteRequest('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, inviteCode }) });
    return storage.localRegister(email, password);
  },

  getPremium: async () => {
    if (await checkBackend()) return remoteRequest('/api/premium');
    return storage.localGetPremium();
  },

  getLikes: async () => {
    if (await checkBackend()) return remoteRequest('/api/likes');
    return storage.localGetLikes();
  },

  login: async (email: string, password: string) => {
    if (await checkBackend()) return remoteRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    return storage.localLogin(email, password);
  },

  getMe: async () => {
    if (await checkBackend()) return remoteRequest('/api/auth/me');
    return storage.localGetMe();
  },

  updateProfile: async (data: Record<string, unknown>) => {
    if (await checkBackend()) return remoteRequest('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
    return storage.localUpdateProfile(data);
  },

  getProfiles: async (params?: { lat?: number; lng?: number; online?: string; search?: string }) => {
    if (await checkBackend()) {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return remoteRequest('/api/profiles' + qs);
    }
    return storage.localGetProfiles(params);
  },

  getNearby: async (lat: number, lng: number, radius?: number) => {
    if (await checkBackend()) return remoteRequest(`/api/nearby?lat=${lat}&lng=${lng}${radius ? '&radius=' + radius : ''}`);
    return storage.localGetNearby(lat, lng, radius);
  },

  favorite: async (targetId: string) => {
    if (await checkBackend()) return remoteRequest(`/api/favorites/${targetId}`, { method: 'POST' });
    return storage.localFavorite(targetId);
  },

  unfavorite: async (targetId: string) => {
    if (await checkBackend()) return remoteRequest(`/api/favorites/${targetId}`, { method: 'DELETE' });
    return storage.localUnfavorite(targetId);
  },

  getFavorites: async () => {
    if (await checkBackend()) return remoteRequest('/api/favorites');
    return storage.localGetFavorites();
  },

  block: async (targetId: string) => {
    if (await checkBackend()) return remoteRequest(`/api/blocks/${targetId}`, { method: 'POST' });
    return storage.localBlock(targetId);
  },

  report: async (targetId: string, reason: string, details?: string) => {
    if (await checkBackend()) return remoteRequest('/api/reports', { method: 'POST', body: JSON.stringify({ targetId, reason, details }) });
    return storage.localReport(targetId, reason, details);
  },

  getChats: async () => {
    if (await checkBackend()) return remoteRequest('/api/chats');
    return storage.localGetChats();
  },

  getMessages: async (chatId: string) => {
    if (await checkBackend()) return remoteRequest(`/api/chats/${chatId}/messages`);
    return storage.localGetMessages(chatId);
  },

  createChat: async (targetId: string) => {
    if (await checkBackend()) return remoteRequest('/api/chats/start', { method: 'POST', body: JSON.stringify({ targetId }) });
    return storage.localCreateChat(targetId);
  },

  sendMessage: async (chatId: string, text: string) => {
    if (await checkBackend()) return remoteRequest(`/api/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
    return storage.localSendMessage(chatId, text);
  },

  getOnline: async () => {
    if (await checkBackend()) return remoteRequest('/api/online');
    return storage.localGetOnline();
  },

  logout: async () => {
    // Always hit the server directly (bypasses the offline-probe cache) so the
    // httpOnly session cookie is actually cleared — logout must always stick.
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {}
  },

  deleteAccount: async () => {
    if (await checkBackend()) return remoteRequest('/api/auth/me', { method: 'DELETE' });
    return storage.localDeleteAccount();
  },

  deletePhoto: async (index: number) => {
    if (await checkBackend()) return remoteRequest(`/api/photos/${index}`, { method: 'DELETE' });
    return storage.localDeletePhoto(index);
  },

  setMainPhoto: async (index: number) => {
    if (await checkBackend()) return remoteRequest(`/api/photos/main/${index}`, { method: 'PUT' });
    return storage.localSetMainPhoto(index);
  },

  uploadPhotos: async (files: File[]) => {
    if (await checkBackend()) {
      const token = safeGet('chasr_token');
      const formData = new FormData();
      files.forEach(f => formData.append('photos', f));
      const res = await fetch(`${API_URL}/api/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      return res.json();
    }
    return storage.localUploadPhotos(files);
  },
};

import { io } from 'socket.io-client';
import { safeGet } from './safeStorage';
let socket: ReturnType<typeof io> | null = null;

export function connectSocket(token: string) {
  if (backendAvailable === false) return null;
  if (socket?.connected) return socket;
  try { socket = io(API_URL || undefined, { auth: { token } }); return socket; }
  catch { return null; }
}

export function getSocket() { return socket; }
