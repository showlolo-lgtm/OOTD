import api from './client';
import { StyleInspiration } from '../types';

export async function getInspirations(): Promise<StyleInspiration[]> {
  const { data } = await api.get('/api/inspirations');
  return data;
}

export async function addInspiration(formData: FormData): Promise<StyleInspiration> {
  const { data } = await api.post('/api/inspirations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteInspiration(id: number): Promise<void> {
  await api.delete(`/api/inspirations/${id}`);
}
