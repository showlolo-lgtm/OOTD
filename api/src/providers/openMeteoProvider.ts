import { fetchJson } from "../lib/http.js";
import { weatherBand } from "../lib/styleRules.js";
import type { LocationInput, WeatherSnapshot } from "../types.js";
import type { WeatherProvider } from "./weatherProvider.js";

interface OpenMeteoResponse {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    precipitation_probability_max: number[];
  };
}

function mapWeatherCode(weatherCode: number, highC: number): {
  summary: string;
  isRainLikely: boolean;
  styleTags: string[];
} {
  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return {
      summary: "阵雨贯穿全天，空气偏凉。",
      isRainLikely: true,
      styleTags: ["rainy", weatherBand(highC), "layered"]
    };
  }

  if ([71, 73, 75, 85, 86].includes(weatherCode)) {
    return {
      summary: "有降雪或结冰风险，注意保暖防滑。",
      isRainLikely: true,
      styleTags: ["snowy", "cold", "layered"]
    };
  }

  if ([1, 2, 3, 45, 48].includes(weatherCode)) {
    return {
      summary: "云层偏多，光线柔和。",
      isRainLikely: false,
      styleTags: ["cloudy", weatherBand(highC), "textured"]
    };
  }

  return {
    summary: "整体晴朗明亮，体感轻快。",
    isRainLikely: false,
    styleTags: ["sunny", weatherBand(highC), "clean-lines"]
  };
}

export function normalizeOpenMeteoForecast(
  payload: OpenMeteoResponse,
  targetDate: string
): WeatherSnapshot {
  const index = payload.daily.time.indexOf(targetDate);

  if (index === -1) {
    throw new Error(`没有找到 ${targetDate} 的天气预报。`);
  }

  const highC = payload.daily.temperature_2m_max[index];
  const lowC = payload.daily.temperature_2m_min[index];
  const apparentHighC = payload.daily.apparent_temperature_max[index];
  const apparentLowC = payload.daily.apparent_temperature_min[index];
  const precipitationProbability = payload.daily.precipitation_probability_max[index];
  const weatherCode = payload.daily.weather_code[index];

  if (
    highC === undefined ||
    lowC === undefined ||
    apparentHighC === undefined ||
    apparentLowC === undefined ||
    precipitationProbability === undefined ||
    weatherCode === undefined
  ) {
    throw new Error("Open-Meteo 返回的日级天气数据不完整");
  }

  const mapped = mapWeatherCode(weatherCode, highC);

  return {
    date: targetDate,
    highC,
    lowC,
    apparentHighC,
    apparentLowC,
    precipitationProbability,
    weatherCode,
    summary: mapped.summary,
    isRainLikely: mapped.isRainLikely,
    styleTags: mapped.styleTags
  };
}

export class OpenMeteoProvider implements WeatherProvider {
  async getTomorrowWeather(location: LocationInput, targetDate: string): Promise<WeatherSnapshot> {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(location.lat));
    url.searchParams.set("longitude", String(location.lon));
    url.searchParams.set(
      "daily",
      [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "apparent_temperature_max",
        "apparent_temperature_min",
        "precipitation_probability_max"
      ].join(",")
    );
    url.searchParams.set("forecast_days", "3");
    url.searchParams.set("timezone", "auto");

    const payload = await fetchJson<OpenMeteoResponse>(url.toString());
    return normalizeOpenMeteoForecast(payload, targetDate);
  }
}
