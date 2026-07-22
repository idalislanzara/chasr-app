import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { api, connectSocket } from './api';

export interface AuthUser {
  id: string;
  email: string;
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

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string) => Promise<{ error?: string }>;
  completeProfile: (profile: Partial<AuthUser>) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: raw.id as string,
    email: raw.email as string,
    name: (raw.name as string) || '',
    age: (raw.age as number) || 18,
    pronouns: (raw.pronouns as string) || '',
    identity: (raw.identity as string) || '',
    tagline: (raw.tagline as string) || '',
    bio: (raw.bio as string) || '',
    photos: typeof raw.photos === 'string' ? JSON.parse(raw.photos as string) : (raw.photos as string[]) || [],
    height: (raw.height as string) || '',
    body_type: (raw.body_type as string) || '',
    ethnicity: (raw.ethnicity as string) || '',
    looking_for: typeof raw.looking_for === 'string' ? JSON.parse(raw.looking_for as string) : (raw.looking_for as string[]) || [],
    interests: typeof raw.interests === 'string' ? JSON.parse(raw.interests as string) : (raw.interests as string[]) || [],
    verified: Boolean(raw.verified),
    lat: (raw.lat as number) || 40.7306,
    lng: (raw.lng as number) || -73.9866,
    location_sharing: raw.location_sharing !== undefined ? Boolean(raw.location_sharing) : true,
    joined_at: (raw.joined_at as number) || Date.now(),
    last_active: (raw.last_active as number) || Date.now(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = state.user;

  // Restore session from token
  useEffect(() => {
    const token = localStorage.getItem('chasr_token');
    if (!token) { setState({ user: null, loading: false }); return; }

    api.getMe()
      .then((raw) => {
        const user = mapUser(raw);
        setState({ user, loading: false });
        connectSocket(token);
      })
      .catch(() => {
        localStorage.removeItem('chasr_token');
        setState({ user: null, loading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true }));
    try {
      const data = await api.login(email, password);
      localStorage.setItem('chasr_token', data.token);
      const user = mapUser(data.user);
      localStorage.setItem('chasr_user_id', user.id);
      setState({ user, loading: false });
      connectSocket(data.token);
      return {};
    } catch (err: unknown) {
      setState(s => ({ ...s, loading: false }));
      return { error: (err as Error).message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true }));
    try {
      const data = await api.register(email, password);
      localStorage.setItem('chasr_token', data.token);
      const user = mapUser(data.user);
      localStorage.setItem('chasr_user_id', user.id);
      setState({ user, loading: false });
      connectSocket(data.token);
      return {};
    } catch (err: unknown) {
      setState(s => ({ ...s, loading: false }));
      return { error: (err as Error).message || 'Registration failed' };
    }
  }, []);

  const completeProfile = useCallback(async (profile: Partial<AuthUser>) => {
    try {
      const raw = await api.updateProfile(profile);
      const user = mapUser(raw);
      setState({ user, loading: false });
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    try {
      const raw = await api.updateProfile(updates);
      const user = mapUser(raw);
      setState({ user, loading: false });
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, loading: false });
    localStorage.removeItem('chasr_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user: state.user, loading: state.loading, login, register, completeProfile, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
