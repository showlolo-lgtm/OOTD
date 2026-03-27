import type {
  CalendarScenario,
  InspirationItem,
  WardrobeItem,
  WeatherSnapshot
} from "../types.js";

const RAIN_SHOE_BLACKLIST = new Set(["sandal", "mesh", "open-toe"]);

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function weatherBand(highC: number): "cold" | "cool" | "mild" | "warm" | "hot" {
  if (highC <= 8) return "cold";
  if (highC <= 16) return "cool";
  if (highC <= 23) return "mild";
  if (highC <= 28) return "warm";
  return "hot";
}

export function targetWarmth(highC: number): number {
  switch (weatherBand(highC)) {
    case "cold":
      return 4.6;
    case "cool":
      return 3.6;
    case "mild":
      return 2.8;
    case "warm":
      return 1.9;
    case "hot":
      return 1.1;
  }
}

export function desiredFormality(tags: string[]): number {
  const normalized = tags.map(normalizeToken);
  if (normalized.some((tag) => ["boardroom", "client", "office", "meeting"].includes(tag))) {
    return 4.4;
  }
  if (normalized.some((tag) => ["date", "gallery", "dinner", "after-hours"].includes(tag))) {
    return 3.8;
  }
  if (normalized.some((tag) => ["commute", "coffee", "studio", "creative"].includes(tag))) {
    return 3.2;
  }
  return 2.6;
}

export function paletteMatchScore(colors: string[], palette: string[]): number {
  const left = new Set(colors.map(normalizeToken));
  const right = new Set(palette.map(normalizeToken));
  let matches = 0;

  for (const token of left) {
    if (right.has(token)) {
      matches += 1;
    }
  }

  return matches;
}

export function isItemWeatherAppropriate(
  item: WardrobeItem,
  weather: Pick<WeatherSnapshot, "highC" | "isRainLikely">
): boolean {
  const band = weatherBand(weather.highC);

  if (band === "cold" && item.warmth < 2 && item.category !== "accessory") return false;
  if (band === "cool" && item.warmth < 1.5 && item.category !== "accessory") return false;
  if (band === "hot" && item.warmth > 3.2) return false;

  if (
    weather.isRainLikely &&
    item.category === "shoes" &&
    item.tags.some((tag) => RAIN_SHOE_BLACKLIST.has(normalizeToken(tag)))
  ) {
    return false;
  }

  return true;
}

export function scoreWardrobeItem(
  item: WardrobeItem,
  input: {
    scenario: CalendarScenario;
    weather: WeatherSnapshot;
    luckyColor: string;
    inspiration: InspirationItem[];
  }
): number {
  let score = 100;
  const formalityGap = Math.abs(item.formality - desiredFormality(input.scenario.occasionTags));
  const warmthGap = Math.abs(item.warmth - targetWarmth(input.weather.highC));
  const inspirationPalette = input.inspiration.flatMap((entry) => entry.palette);

  score -= formalityGap * 16;
  score -= warmthGap * 14;
  score += paletteMatchScore(item.colors, [input.luckyColor, ...inspirationPalette]) * 10;

  const tokenSet = new Set(
    [...input.scenario.occasionTags, ...input.inspiration.flatMap((entry) => entry.keywords)].map(
      normalizeToken
    )
  );
  const tagMatches = item.tags.filter((tag) => tokenSet.has(normalizeToken(tag))).length;
  score += tagMatches * 8;

  if (!isItemWeatherAppropriate(item, input.weather)) {
    score -= 40;
  }

  return score;
}

export function summariseWeatherWindow(weather: WeatherSnapshot): string {
  const rainSuffix = weather.isRainLikely
    ? `，降雨概率约 ${weather.precipitationProbability}%`
    : "";
  return `${Math.round(weather.lowC)}-${Math.round(weather.highC)}°C${rainSuffix}`;
}
