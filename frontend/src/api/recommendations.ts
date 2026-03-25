import api from './client';
import { Outfit, RecommendationRequest } from '../types';

export async function generateRecommendations(
  request: RecommendationRequest
): Promise<Outfit[]> {
  const { data } = await api.post('/api/recommendations/generate', request);
  return data;
}

export async function getTodayRecommendations(): Promise<Outfit[]> {
  const { data } = await api.get('/api/recommendations/today');
  return data;
}

export async function rateRecommendation(
  id: number,
  rating: number
): Promise<Outfit> {
  const { data } = await api.post(`/api/recommendations/${id}/rate`, { rating });
  return data;
}
