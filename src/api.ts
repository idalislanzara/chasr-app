import * as storage from './storage';

const API_URL = import.meta.env.VITE_API_URL || '';

let backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(`${API_URL}/api/online`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timeout);
    backendAvailable = true;
    return true;
  } catch {
    backendAvailable = false;
    return false;
  }
}

async function remoteRequest(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('chasr_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: async (email: string, password: string) => {
    if (await checkBackend()) {
      return remoteRequest('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
    }
    return storage.localRegister(email, password);
  },

  login: async (email: string, password: string) => {
    if (await checkBackend()) {
      return remoteRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    }
    return storage.localLogin(email, password);
  },

  getMe: async () => {
    if (await checkBackend()) {
      return remoteRequest('/api/auth/me');
    }
    return storage.localGetMe();
  },

  updateProfile: async (data: Record<string, unknown>) => {
    if (await checkBackend()) {
      return remoteRequest('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
    }
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
    if (await checkBackend()) {
      return remoteRequest(`/api/nearby?lat=${lat}&lng=${lng}${radius ? '&radius=' + radius : ''}`);
    }
    return storage.localGetNearby(lat, lng, radius);
  },

  favorite: async (targetId: string) => {
    if (await checkBackend()) {
      return remoteRequest(`/api/favorites/${targetId}`, { method: 'POST' });
    }
    return storage.localFavorite(targetId);
  },

  unfavorite: async (targetId: string) => {
    if (await checkBackend()) {
      return remoteRequest(`/api/favorites/${targetId}`, { method: 'DELETE' });
    }
    return storage.localUnfavorite(targetId);
  },

  getFavorites: async () => {
    if (await checkBackend()) {
      return remoteRequest('/api/favorites');
    }
    return storage.localGetFavorites();
  },

  block: async (targetId: string) => {
    if (await checkBackend()) {
      return remoteRequest(`/api/blocks/${targetId}`, { method: 'POST' });
    }
    return storage.localBlock(targetId);
  },

  getChats: async () => {
    if (await checkBackend()) {
      return remoteRequest('/api/chats');
    }
    return storage.localGetChats();
  },

  getMessages: async (chatId: string) => {
    if (await checkBackend()) {
      return remoteRequest(`/api/chats/${chatId}/messages`);
    }
    return storage.localGetMessages(chatId);
  },

  sendMessage: async (chatId: string, text: string) => {
    if (await checkBackend()) {
      return remoteRequest(`/api/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
    }
    return storage.localSendMessage(chatId, text);
  },

  getOnline: async () => {
    if (await checkBackend()) {
      return remoteRequest('/api/online');
    }
    return storage.localGetOnline();
  },

  seed: async () => {
    if (await checkBackend()) {
      return remoteRequest('/api/seed', { method: 'POST' });
    }
    return storage.localSeed();
  },

  uploadPhotos: async (files: File[]) => {
    if (await checkBackend()) {
      const token = localStorage.getItem('chasr_token');
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

// Socket.io client (only works with backend)
import { io } from 'socket.io-client';

let socket: ReturnType<typeof io> | null = null;

export function connectSocket(token: string) {
  if (backendAvailable === false) return null;
  if (socket?.connected) return socket;
  try {
    socket = io(API_URL, { auth: { token } });
    return socket;
  } catch {
    return null;
  }
}

export function getSocket() {
  return socket;
}
