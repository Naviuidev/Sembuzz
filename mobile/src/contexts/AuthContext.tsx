import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';

const TOKEN_KEY = 'user-token';

type User = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePicUrl?: string;
  schoolId: string | null;
  schoolName?: string | null;
  schoolImage?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/** Web login opens `sembuzz://auth?token=<jwt>` so the native app can reuse the session. */
function extractTokenFromSembuzzUrl(url: string): string | null {
  if (!url.startsWith('sembuzz://')) return null;
  const q = url.indexOf('?');
  if (q === -1) return null;
  const params = new URLSearchParams(url.slice(q + 1));
  return params.get('token');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const applyBearerToken = useCallback(async (t: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    const res = await api.get<User>('/user/auth/me', {
      headers: { Authorization: `Bearer ${t}` },
    });
    const u = res.data;
    setUser(u ? { ...u, schoolId: u.schoolId ?? null } : null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    const res = await api.get<User>('/user/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const u = res.data;
    setUser(u ? { ...u, schoolId: u.schoolId ?? null } : null);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        const deepToken = initialUrl ? extractTokenFromSembuzzUrl(initialUrl) : null;
        if (deepToken) {
          try {
            await applyBearerToken(deepToken);
          } catch {
            if (!cancelled) {
              await AsyncStorage.removeItem(TOKEN_KEY);
              setToken(null);
              setUser(null);
            }
          } finally {
            if (!cancelled) setLoading(false);
          }
          return;
        }

        const t = await AsyncStorage.getItem(TOKEN_KEY);
        if (cancelled) return;
        if (!t) {
          setLoading(false);
          return;
        }
        setToken(t);
        const res = await api.get<User>('/user/auth/me', {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (cancelled) return;
        const u = res.data;
        setUser(u ? { ...u, schoolId: u.schoolId ?? null } : null);
      } catch {
        if (!cancelled) {
          await AsyncStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applyBearerToken]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const deepToken = extractTokenFromSembuzzUrl(url);
      if (!deepToken) return;
      void (async () => {
        try {
          await applyBearerToken(deepToken);
        } catch {
          await AsyncStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      })();
    });
    return () => sub.remove();
  }, [applyBearerToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>('/user/auth/login', {
      email: email.trim(),
      password,
    });
    const t = res.data?.access_token;
    const u = res.data?.user ?? null;
    if (!t || !u) {
      throw new Error('Invalid login response from server.');
    }
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser({ ...u, schoolId: u.schoolId ?? null });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshMe, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
