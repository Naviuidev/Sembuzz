import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { subCategoryAdminAuthService } from '../services/subcategory-admin-auth.service';
import type { SubCategoryAdminUser } from '../services/subcategory-admin-auth.service';

const IDLE_LOGOUT_MS = 10 * 60 * 1000; // 10 minutes

interface SubCategoryAdminAuthContextType {
  user: SubCategoryAdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const SubCategoryAdminAuthContext = createContext<SubCategoryAdminAuthContextType | undefined>(undefined);

export const SubCategoryAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SubCategoryAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('subcategory-admin-token'));
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getMeSucceededRef = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('subcategory-admin-token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      getMeSucceededRef.current = false;
      const storedToken = localStorage.getItem('subcategory-admin-token');
      if (storedToken) {
        try {
          const userData = await subCategoryAdminAuthService.getMe();
          getMeSucceededRef.current = true;
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('SubCategoryAdminAuthContext: Failed to fetch user data on init:', error);
          const status = (error as { response?: { status?: number } })?.response?.status;
          // Only clear on 401 and only if no other getMe() already succeeded (avoids Strict Mode double-mount race)
          if (status === 401 && !getMeSucceededRef.current) {
            localStorage.removeItem('subcategory-admin-token');
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    // Refresh user data periodically to pick up changes
    const refreshInterval = setInterval(async () => {
      const storedToken = localStorage.getItem('subcategory-admin-token');
      if (storedToken) {
        try {
          const userData = await subCategoryAdminAuthService.getMe();
          setUser(userData);
        } catch (error) {
          console.error('SubCategoryAdminAuthContext: Failed to refresh user data:', error);
        }
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // 10-minute idle timeout: logout only when user is on subcategory-admin and has been inactive for 10 mins
  useEffect(() => {
    if (!token) return;

    const scheduleIdleLogout = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        const path = window.location.pathname;
        if (path.startsWith('/subcategory-admin') && path !== '/subcategory-admin/login') {
          logout();
          window.location.href = '/subcategory-admin/login';
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

  const login = async (email: string, password: string) => {
    const response = await subCategoryAdminAuthService.login({ email, password });
    localStorage.setItem('subcategory-admin-token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await subCategoryAdminAuthService.changePassword({ currentPassword, newPassword, confirmPassword });
    logout();
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('subcategory-admin-token');
    if (storedToken) {
      try {
        const userData = await subCategoryAdminAuthService.getMe();
        setUser(userData);
      } catch (error) {
        console.error('SubCategoryAdminAuthContext: Failed to refresh user data:', error);
        // Don't logout on refresh failure, just log the error
      }
    }
  };

  return (
    <SubCategoryAdminAuthContext.Provider
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
    </SubCategoryAdminAuthContext.Provider>
  );
};

export const useSubCategoryAdminAuth = () => {
  const context = useContext(SubCategoryAdminAuthContext);
  if (context === undefined) {
    throw new Error('useSubCategoryAdminAuth must be used within a SubCategoryAdminAuthProvider');
  }
  return context;
};
