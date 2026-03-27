import type {
  CalendarScenario,
  FortuneSnapshot,
  InspirationItem,
  WeatherSnapshot
} from "../types.js";

export interface InspirationProviderInput {
  scenario: CalendarScenario;
  weather: WeatherSnapshot;
  fortune: FortuneSnapshot;
  limit?: number;
}

export interface InspirationProvider {
  getInspiration(input: InspirationProviderInput): Promise<InspirationItem[]>;
}
