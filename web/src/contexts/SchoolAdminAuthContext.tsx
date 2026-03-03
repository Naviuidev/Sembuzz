import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { schoolAdminAuthService } from '../services/school-admin-auth.service';
import type { SchoolAdminUser } from '../services/school-admin-auth.service';

interface SchoolAdminAuthContextType {
  user: SchoolAdminUser | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const SchoolAdminAuthContext = createContext<SchoolAdminAuthContextType | undefined>(undefined);

export const SchoolAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SchoolAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('school-admin-token'));
  const [loading, setLoading] = useState(true);

  const getMeSucceededRef = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      getMeSucceededRef.current = false;
      const storedToken = localStorage.getItem('school-admin-token');
      if (storedToken) {
        try {
          const userData = await schoolAdminAuthService.getMe();
          getMeSucceededRef.current = true;
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('SchoolAdminAuthContext: Failed to fetch user data on init:', error);
          const status = (error as { response?: { status?: number } })?.response?.status;
          // Only clear on 401; don't clear on network or other errors (avoids false logouts)
          if (status === 401 && !getMeSucceededRef.current) {
            localStorage.removeItem('school-admin-token');
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const response = await schoolAdminAuthService.login({ identifier, password });
    localStorage.setItem('school-admin-token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('school-admin-token');
    setToken(null);
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await schoolAdminAuthService.changePassword({ currentPassword, newPassword, confirmPassword });
    // After password change, logout user
    logout();
  };

  return (
    <SchoolAdminAuthContext.Provider
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
    </SchoolAdminAuthContext.Provider>
  );
};

export const useSchoolAdminAuth = () => {
  const context = useContext(SchoolAdminAuthContext);
  if (context === undefined) {
    throw new Error('useSchoolAdminAuth must be used within a SchoolAdminAuthProvider');
  }
  return context;
};
