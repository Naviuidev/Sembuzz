import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { userAuthService } from '../services/user-auth.service';
import type { UserAuthUser, RegisterDto, RegisterResponse } from '../services/user-auth.service';

const USER_TOKEN_KEY = 'user-token';

interface UserAuthContextType {
  user: UserAuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (dto: RegisterDto) => Promise<RegisterResponse>;
  completeRegistration: (accessToken: string, user: UserAuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(USER_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(USER_TOKEN_KEY);
      if (storedToken) {
        try {
          const userData = await userAuthService.getMe();
          setUser(userData);
          setToken(storedToken);
        } catch {
          localStorage.removeItem(USER_TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await userAuthService.login(email, password);
    localStorage.setItem(USER_TOKEN_KEY, response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  const register = async (dto: RegisterDto): Promise<RegisterResponse> => {
    const response = await userAuthService.register(dto);
    if ('access_token' in response && response.access_token) {
      localStorage.setItem(USER_TOKEN_KEY, response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    }
    return response;
  };

  const completeRegistration = (accessToken: string, userData: UserAuthUser) => {
    localStorage.setItem(USER_TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(USER_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem(USER_TOKEN_KEY);
    if (!storedToken) return;
    const userData = await userAuthService.getMe();
    setUser(userData);
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        completeRegistration,
        logout,
        refreshUser,
        isAuthenticated: !!user && !!token,
        loading,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};
