import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { schoolAdminAuthService } from '../services/school-admin-auth.service';
import type { SchoolAdminUser } from '../services/school-admin-auth.service';

const IDLE_LOGOUT_MS = 10 * 60 * 1000; // 10 minutes

interface SchoolAdminAuthContextType {
  user: SchoolAdminUser | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const SchoolAdminAuthContext = createContext<SchoolAdminAuthContextType | undefined>(undefined);

export const SchoolAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SchoolAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('school-admin-token'));
  const [loading, setLoading] = useState(true);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getMeSucceededRef = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('school-admin-token');
    setToken(null);
    setUser(null);
  }, []);

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

  // 10-minute idle timeout: logout only when user is on school-admin and has been inactive for 10 mins
  useEffect(() => {
    if (!token) return;

    const scheduleIdleLogout = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        const path = window.location.pathname;
        if (path.startsWith('/school-admin') && path !== '/school-admin/login') {
          logout();
          window.location.href = '/school-admin/login';
        }
        idleTimerRef.current = null;
      }, IDLE_LOGOUT_MS);
    };

    const onActivity = () => scheduleIdleLogout();

    scheduleIdleLogout();
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('touchstart', onActivity);
    window.addEventListener('scroll', onActivity);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('scroll', onActivity);
    };
  }, [token, logout]);

  const login = async (identifier: string, password: string) => {
    const response = await schoolAdminAuthService.login({ identifier, password });
    localStorage.setItem('school-admin-token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await schoolAdminAuthService.changePassword({ currentPassword, newPassword, confirmPassword });
    // After password change, logout user
    logout();
  };

  const refreshUser = async () => {
    const userData = await schoolAdminAuthService.getMe();
    setUser(userData);
  };

  return (
    <SchoolAdminAuthContext.Provider
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
