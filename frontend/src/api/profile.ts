import api from './client';
import { UserProfile } from '../types';

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get('/api/profile');
  return data;
}

export async function updateProfile(
  update: Partial<UserProfile>
): Promise<UserProfile> {
  const { data } = await api.put('/api/profile', update);
  return data;
}

export async function uploadBodyPhoto(formData: FormData): Promise<UserProfile> {
  const { data } = await api.post('/api/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
