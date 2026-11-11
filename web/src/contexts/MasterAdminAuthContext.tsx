import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  masterAdminAuthService,
  type MasterAdminUser,
} from '../services/master-admin-auth.service';

interface MasterAdminAuthContextType {
  user: MasterAdminUser | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<MasterAdminUser>;
  setPassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<MasterAdminUser>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const MasterAdminAuthContext = createContext<MasterAdminAuthContextType | undefined>(undefined);

export const MasterAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MasterAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('master-admin-token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('master-admin-token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('master-admin-token');
      if (storedToken) {
        try {
          const userData = await masterAdminAuthService.getMe();
          setUser(userData);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('master-admin-token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    void initAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<MasterAdminUser> => {
    const response = await masterAdminAuthService.login({ identifier, password });
    localStorage.setItem('master-admin-token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    return response.user;
  };

  const setPassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<MasterAdminUser> => {
    const response = await masterAdminAuthService.setPassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    localStorage.setItem('master-admin-token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    return response.user;
  };

  return (
    <MasterAdminAuthContext.Provider
      value={{
        user,
        token,
        login,
        setPassword,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </MasterAdminAuthContext.Provider>
  );
};

export const useMasterAdminAuth = () => {
  const context = useContext(MasterAdminAuthContext);
  if (context === undefined) {
    throw new Error('useMasterAdminAuth must be used within a MasterAdminAuthProvider');
  }
  return context;
};
