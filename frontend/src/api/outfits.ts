import api from './client';
import { Outfit } from '../types';

export async function getOutfits(source?: string): Promise<Outfit[]> {
  const { data } = await api.get('/api/outfits', { params: source ? { source } : {} });
  return data;
}

export async function getOutfit(id: number): Promise<Outfit> {
  const { data } = await api.get(`/api/outfits/${id}`);
  return data;
}

export async function createOutfit(data: {
  name: string;
  occasion?: string;
  clothing_item_ids: number[];
}): Promise<Outfit> {
  const { data: result } = await api.post('/api/outfits', data);
  return result;
}

export async function deleteOutfit(id: number): Promise<void> {
  await api.delete(`/api/outfits/${id}`);
}
