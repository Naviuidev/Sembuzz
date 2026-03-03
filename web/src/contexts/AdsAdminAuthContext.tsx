import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { adsAdminAuthService } from '../services/ads-admin-auth.service';
import type { AdsAdminUser } from '../services/ads-admin-auth.service';

interface AdsAdminAuthContextType {
  user: AdsAdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AdsAdminUser>;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    options?: { skipLogout?: boolean }
  ) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AdsAdminAuthContext = createContext<AdsAdminAuthContextType | undefined>(undefined);

export const AdsAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdsAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ads-admin-token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('ads-admin-token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ads-admin-token');
      if (storedToken) {
        try {
          const userData = await adsAdminAuthService.getMe();
          setUser(userData);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('ads-admin-token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AdsAdminUser> => {
    const response = await adsAdminAuthService.login({ email, password });
    localStorage.setItem('ads-admin-token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    return response.user;
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    options?: { skipLogout?: boolean }
  ) => {
    await adsAdminAuthService.changePassword({ currentPassword, newPassword, confirmPassword });
    if (options?.skipLogout) {
      const userData = await adsAdminAuthService.getMe();
      setUser(userData);
    } else {
      logout();
    }
  };

  return (
    <AdsAdminAuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        changePassword,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AdsAdminAuthContext.Provider>
  );
};

export const useAdsAdminAuth = () => {
  const context = useContext(AdsAdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdsAdminAuth must be used within an AdsAdminAuthProvider');
  }
  return context;
};
