import { api } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const logId = `API-${Date.now()}`;
    const apiUrl = '/super-admin/auth/login';
    console.log(`[${logId}] authService: Making login request`);
    console.log(`[${logId}] authService: URL:`, apiUrl);
    console.log(`[${logId}] authService: Credentials:`, { email: credentials.email, password: '***' });
    try {
      const response = await api.post<LoginResponse>(apiUrl, credentials);
      console.log(`[${logId}] authService: Login response received`);
      console.log(`[${logId}] authService: Status:`, response.status);
      console.log(`[${logId}] authService: Data:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[${logId}] authService: Login request failed`);
      console.error(`[${logId}] authService: Error type:`, error.constructor.name);
      console.error(`[${logId}] authService: Error message:`, error.message);
      console.error(`[${logId}] authService: Error response status:`, error.response?.status);
      console.error(`[${logId}] authService: Error response data:`, error.response?.data);
      console.error(`[${logId}] authService: Full error:`, error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/super-admin/auth/logout');
    } catch (error) {
      // Even if logout API call fails, clear the token locally
      console.warn('[authService] Logout API call failed, clearing token locally:', error);
    } finally {
      // Always remove the super admin token, regardless of API call result
      localStorage.removeItem('token');
      // Don't remove other admin tokens (school-admin, category-admin)
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/super-admin/auth/me');
    return response.data;
  },
};
