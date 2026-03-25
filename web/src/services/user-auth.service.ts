import { api } from '../config/api';

export interface UserAuthUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  schoolId: string;
  schoolName: string;
  schoolImage?: string;
  profilePicUrl?: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  profilePicUrl: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface RegisterDto {
  registrationMethod: 'school_domain' | 'gmail';
  firstName: string;
  lastName: string;
  profilePicUrl?: string;
  schoolId: string;
  email: string;
  password: string;
  /** Required for gmail/public: URL from upload-registration-doc */
  verificationDocUrl?: string;
}

export type RegisterResponse =
  | { requiresOtp: true; email: string; devOtp?: string }
  | { pendingApproval: true }
  | { access_token: string; user: UserAuthUser };

export interface LoginResponse {
  access_token: string;
  user: UserAuthUser;
}

export interface SchoolOption {
  id: string;
  name: string;
  domain: string | null;
  image: string | null;
}

export const userAuthService = {
  getSchools: async (): Promise<SchoolOption[]> => {
    const response = await api.get<SchoolOption[]>('/user/auth/schools');
    return response.data;
  },

  uploadRegistrationDoc: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/user/auth/upload-registration-doc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadProfilePic: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/user/auth/upload-profile-pic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  register: async (dto: RegisterDto): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/user/auth/register', dto);
    return response.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<{ success: boolean; email: string }> => {
    const response = await api.post<{ success: boolean; email: string }>('/user/auth/verify-otp', { email, otp });
    return response.data;
  },

  resendOtp: async (email: string): Promise<{ success: boolean; devOtp?: string }> => {
    const response = await api.post<{ success: boolean; devOtp?: string }>('/user/auth/resend-otp', { email });
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/user/auth/login', { email, password });
    return response.data;
  },

  getMe: async (): Promise<UserAuthUser> => {
    const response = await api.get<UserAuthUser>('/user/auth/me');
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserAuthUser> => {
    const response = await api.post<UserAuthUser>('/user/auth/update-profile', payload);
    return response.data;
  },

  deleteAccount: async (password: string): Promise<{ success: true }> => {
    const response = await api.post<{ success: true }>('/user/auth/delete-account', {
      password,
    });
    return response.data;
  },

  verifyUpdateDocToken: async (token: string): Promise<{ valid: boolean; type: 'reupload' | 'additional'; email: string }> => {
    const response = await api.get<{ valid: boolean; type: 'reupload' | 'additional'; email: string }>(
      '/user/auth/verify-update-doc-token',
      { params: { token } },
    );
    return response.data;
  },

  submitUpdateDoc: async (token: string, file: File): Promise<{ success: boolean }> => {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('file', file);
    const response = await api.post<{ success: boolean }>('/user/auth/submit-update-doc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  verifyApproval: async (token: string): Promise<{ success: boolean }> => {
    const response = await api.get<{ success: boolean }>('/user/auth/verify-approval', {
      params: { token },
    });
    return response.data;
  },
};
