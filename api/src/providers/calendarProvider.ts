import type { CalendarScenario } from "../types.js";

export interface CalendarProvider {
  listTomorrowScenarios(referenceDate?: string): Promise<CalendarScenario[]>;
}
