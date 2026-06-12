import api from './client';
import type { AppUser, Member } from './types';

export interface SamratLoginResponse {
  access_token: string;
  token_type: string;
  user: AppUser;
  member: Member | null;
}

export async function sendOtp(phone: string, name?: string): Promise<void> {
  await api.post('/samrat/auth/otp/send', { phone, name });
}

export async function verifyOtp(phone: string, otp: string): Promise<SamratLoginResponse> {
  const res = await api.post<SamratLoginResponse>('/samrat/auth/otp/verify', { phone, otp });
  return res.data;
}
