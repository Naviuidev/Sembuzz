import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { categoryAdminAuthService } from '../services/category-admin-auth.service';
import type { CategoryAdminUser } from '../services/category-admin-auth.service';

const IDLE_LOGOUT_MS = 10 * 60 * 1000; // 10 minutes

interface CategoryAdminAuthContextType {
  user: CategoryAdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const CategoryAdminAuthContext = createContext<CategoryAdminAuthContextType | undefined>(undefined);

export const CategoryAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CategoryAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('category-admin-token'));
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getMeSucceededRef = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('category-admin-token');
    localStorage.removeItem('category-admin-login-at');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      getMeSucceededRef.current = false;
      const storedToken = localStorage.getItem('category-admin-token');
      if (storedToken) {
        try {
          const userData = await categoryAdminAuthService.getMe();
          getMeSucceededRef.current = true;
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('CategoryAdminAuthContext: Failed to fetch user data on init:', error);
          const status = (error as { response?: { status?: number } })?.response?.status;
          // Only clear on 401 and only if no other getMe() already succeeded (avoids Strict Mode double-mount race)
          if (status === 401 && !getMeSucceededRef.current) {
            localStorage.removeItem('category-admin-token');
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 10-minute idle timeout: logout only when user is on category-admin and has been inactive for 10 mins
  useEffect(() => {
    if (!token) return;

    const scheduleIdleLogout = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        const path = window.location.pathname;
        if (path.startsWith('/category-admin') && path !== '/category-admin/login') {
          logout();
          window.location.href = '/category-admin/login';
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
    const response = await categoryAdminAuthService.login({ email, password });
    localStorage.setItem('category-admin-token', response.access_token);
    localStorage.setItem('category-admin-login-at', Date.now().toString());
    setToken(response.access_token);
    setUser(response.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await categoryAdminAuthService.changePassword({ currentPassword, newPassword, confirmPassword });
    // After password change, logout user
    logout();
  };

  return (
    <CategoryAdminAuthContext.Provider
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
    </CategoryAdminAuthContext.Provider>
  );
};

export const useCategoryAdminAuth = () => {
  const context = useContext(CategoryAdminAuthContext);
  if (context === undefined) {
    throw new Error('useCategoryAdminAuth must be used within a CategoryAdminAuthProvider');
  }
  return context;
};
