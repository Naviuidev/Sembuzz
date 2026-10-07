import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  externalAdminAuthService,
  type ExternalAdminUser,
} from '../services/external-admin-auth.service';

interface ExternalAdminAuthContextType {
  user: ExternalAdminUser | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<ExternalAdminUser>;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    options?: { skipLogout?: boolean },
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const ExternalAdminAuthContext = createContext<ExternalAdminAuthContextType | undefined>(undefined);

export const ExternalAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ExternalAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('external-admin-token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('external-admin-token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('external-admin-token');
      if (storedToken) {
        try {
          const userData = await externalAdminAuthService.getMe();
          setUser(userData);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('external-admin-token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<ExternalAdminUser> => {
    const response = await externalAdminAuthService.login({ identifier, password });
    localStorage.setItem('external-admin-token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    return response.user;
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    options?: { skipLogout?: boolean },
  ) => {
    await externalAdminAuthService.changePassword({ currentPassword, newPassword, confirmPassword });
    if (options?.skipLogout) {
      const userData = await externalAdminAuthService.getMe();
      setUser(userData);
    } else {
      logout();
    }
  };

  const refreshUser = async () => {
    const userData = await externalAdminAuthService.getMe();
    setUser(userData);
  };

  return (
    <ExternalAdminAuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        changePassword,
        refreshUser,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </ExternalAdminAuthContext.Provider>
  );
};

export const useExternalAdminAuth = () => {
  const context = useContext(ExternalAdminAuthContext);
  if (context === undefined) {
    throw new Error('useExternalAdminAuth must be used within an ExternalAdminAuthProvider');
  }
  return context;
};
