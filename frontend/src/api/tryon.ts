import api from './client';
import { Outfit } from '../types';

export async function generateTryOn(outfitId: number): Promise<Outfit> {
  const { data } = await api.post('/api/tryon', { outfit_id: outfitId });
  return data;
}
