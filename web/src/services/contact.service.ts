import { api } from '../config/api';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  intent: string;
  message: string;
  query?: string;
}

export interface ContactSubmitResponse {
  success: boolean;
  message: string;
}

export async function submitContact(data: ContactFormData): Promise<ContactSubmitResponse> {
  const response = await api.post<ContactSubmitResponse>('/contact', data);
  return response.data;
}
