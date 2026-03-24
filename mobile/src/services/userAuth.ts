import { api } from '../config/api';

export interface SchoolOption {
  id: string;
  name: string;
  domain: string | null;
  image: string | null;
}

export interface RegisterDto {
  registrationMethod: 'school_domain' | 'gmail';
  firstName: string;
  lastName: string;
  profilePicUrl?: string;
  schoolId: string;
  email: string;
  password: string;
  verificationDocUrl?: string;
}

export type RegisterResponse =
  | { requiresOtp: true; email: string; devOtp?: string }
  | { pendingApproval: true };

export async function getSchools(): Promise<SchoolOption[]> {
  const response = await api.get<SchoolOption[]>('/user/auth/schools');
  return Array.isArray(response.data) ? response.data : [];
}

function appendFile(formData: FormData, uri: string, fileName: string, mimeType: string) {
  formData.append('file', { uri, name: fileName, type: mimeType } as any);
}

export async function uploadProfilePicFromUri(uri: string, fileName: string, mimeType: string): Promise<string> {
  const formData = new FormData();
  appendFile(formData, uri, fileName, mimeType);
  const response = await api.post<{ url: string }>('/user/auth/upload-profile-pic', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url;
}

export async function uploadRegistrationDocFromUri(uri: string, fileName: string, mimeType: string): Promise<string> {
  const formData = new FormData();
  appendFile(formData, uri, fileName, mimeType);
  const response = await api.post<{ url: string }>('/user/auth/upload-registration-doc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url;
}

export async function registerUser(dto: RegisterDto): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/user/auth/register', dto);
  return response.data;
}

export async function verifyRegistrationOtp(email: string, otp: string): Promise<{ success: boolean; email: string }> {
  const response = await api.post<{ success: boolean; email: string }>('/user/auth/verify-otp', { email, otp });
  return response.data;
}

export async function resendRegistrationOtp(email: string): Promise<{ success: boolean; devOtp?: string }> {
  const response = await api.post<{ success: boolean; devOtp?: string }>('/user/auth/resend-otp', { email });
  return response.data;
}
