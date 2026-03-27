import type { CalendarProvider } from "./calendarProvider.js";
import type { CalendarScenario } from "../types.js";

function toIsoAtHour(dateString: string, hour: number, minute = 0): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function tomorrowDate(referenceDate?: string): string {
  if (referenceDate) {
    return referenceDate;
  }

  const current = new Date();
  current.setDate(current.getDate() + 1);
  return current.toISOString().slice(0, 10);
}

export class MockCalendarProvider implements CalendarProvider {
  async listTomorrowScenarios(referenceDate?: string): Promise<CalendarScenario[]> {
    const date = tomorrowDate(referenceDate);

    return [
      {
        id: "commute-atelier",
        title: "工作室通勤和咖啡碰头",
        startTime: toIsoAtHour(date, 9, 0),
        endTime: toIsoAtHour(date, 17, 30),
        location: "静安工作室",
        occasionTags: ["commute", "creative", "coffee", "office"]
      },
      {
        id: "client-rainy",
        title: "市中心客户工作坊",
        startTime: toIsoAtHour(date, 10, 30),
        endTime: toIsoAtHour(date, 18, 0),
        location: "徐汇客户办公室",
        occasionTags: ["office", "client", "meeting", "boardroom"]
      },
      {
        id: "date-gallery",
        title: "下班后约会和看展",
        startTime: toIsoAtHour(date, 19, 0),
        endTime: toIsoAtHour(date, 22, 30),
        location: "法租界",
        occasionTags: ["date", "gallery", "dinner", "after-hours"]
      }
    ];
  }
}
