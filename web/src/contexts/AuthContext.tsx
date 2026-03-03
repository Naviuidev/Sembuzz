import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const getMeSucceededRef = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      getMeSucceededRef.current = false;
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const userData = await authService.getMe();
          getMeSucceededRef.current = true;
          setUser(userData);
        } catch (error: any) {
          if (error?.response?.status === 401 && !getMeSucceededRef.current) {
            console.log('[AuthContext] Token validation failed (401), removing token');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          } else if (error?.response?.status !== 401) {
            console.warn('[AuthContext] Token validation error (non-401), keeping token:', error?.message);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const logId = `AUTH-${Date.now()}`;
    console.log(`[${logId}] AuthContext: Starting login...`);
    try {
      const response = await authService.login({ email, password });
      console.log(`[${logId}] AuthContext: Login response received`, response);
      console.log(`[${logId}] AuthContext: Saving token to localStorage...`);
      localStorage.setItem('token', response.access_token);
      const savedToken = localStorage.getItem('token');
      console.log(`[${logId}] AuthContext: Token saved, verifying:`, savedToken ? 'Token exists' : 'Token missing!');
      console.log(`[${logId}] AuthContext: Token value:`, savedToken?.substring(0, 20) + '...');
      setToken(response.access_token);
      // Set user immediately from login response
      const userData = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        createdAt: new Date().toISOString(),
      };
      setUser(userData);
      console.log(`[${logId}] AuthContext: User set:`, userData);
      console.log(`[${logId}] AuthContext: isAuthenticated should be true (token exists: ${!!response.access_token})`);
      
      // Skip getMe call during login - we already have user data from login response
      // This avoids the 401 error and navigation issues
      console.log(`[${logId}] AuthContext: Skipping getMe call, using user data from login response`);
    } catch (error) {
      console.error(`[${logId}] AuthContext: Login failed`, error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    } finally {
      // Always clear local state, even if API call fails
      setToken(null);
      setUser(null);
      // Only remove super admin token, not other admin tokens
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
