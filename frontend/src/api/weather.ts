import api from './client';
import { Weather } from '../types';

export async function getWeather(city: string): Promise<Weather> {
  const { data } = await api.get('/api/weather', { params: { city } });
  return data;
}
