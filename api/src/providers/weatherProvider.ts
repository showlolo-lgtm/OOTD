import type { LocationInput, WeatherSnapshot } from "../types.js";

export interface WeatherProvider {
  getTomorrowWeather(location: LocationInput, targetDate: string): Promise<WeatherSnapshot>;
}
