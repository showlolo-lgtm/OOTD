import api from './client';
import { ClothingItem } from '../types';

export async function getWardrobe(params?: {
  category?: string;
  season?: string;
  occasion?: string;
}): Promise<ClothingItem[]> {
  const { data } = await api.get('/api/wardrobe', { params });
  return data;
}

export async function addClothingItem(formData: FormData): Promise<ClothingItem> {
  const { data } = await api.post('/api/wardrobe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getClothingItem(id: number): Promise<ClothingItem> {
  const { data } = await api.get(`/api/wardrobe/${id}`);
  return data;
}

export async function updateClothingItem(
  id: number,
  update: Partial<ClothingItem>
): Promise<ClothingItem> {
  const { data } = await api.patch(`/api/wardrobe/${id}`, update);
  return data;
}

export async function deleteClothingItem(id: number): Promise<void> {
  await api.delete(`/api/wardrobe/${id}`);
}
