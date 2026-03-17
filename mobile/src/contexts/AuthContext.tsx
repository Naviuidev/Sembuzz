import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';

const TOKEN_KEY = 'user-token';

type User = {
  id: string;
  email: string;
  name: string;
  schoolId: string | null;
  schoolName?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
        if (!cancelled) await AsyncStorage.removeItem(TOKEN_KEY).then(() => setToken(null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>('/user/auth/login', {
      email: email.trim(),
      password,
    });
    const t = res.data?.access_token;
    const u = res.data?.user ?? null;
    if (t) {
      await AsyncStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setUser(u ? { ...u, schoolId: u.schoolId ?? null } : null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
