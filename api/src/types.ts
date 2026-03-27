export const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces"
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];
export type ClothingCategory =
  | "top"
  | "bottom"
  | "outerwear"
  | "dress"
  | "shoes"
  | "accessory";

export interface WardrobeItem {
  id: string;
  name: string;
  category: ClothingCategory;
  colors: string[];
  seasons: string[];
  formality: number;
  warmth: number;
  tags: string[];
  imageUrl: string;
}

export interface CalendarScenario {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  occasionTags: string[];
}

export interface LocationInput {
  city: string;
  lat: number;
  lon: number;
}

export interface WeatherSnapshot {
  date: string;
  highC: number;
  lowC: number;
  apparentHighC: number;
  apparentLowC: number;
  precipitationProbability: number;
  weatherCode: number;
  summary: string;
  isRainLikely: boolean;
  styleTags: string[];
}

export interface FortuneSnapshot {
  sign: ZodiacSign;
  summary: string;
  luckyColor: string;
  mood: string;
  focus: string;
  energy: string;
}

export interface InspirationItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  weatherTags: string[];
  occasionTags: string[];
  palette: string[];
  formality: number;
  warmth: number;
  vibe: string;
  keywords: string[];
}

export interface ContextSnapshot {
  date: string;
  scenario: CalendarScenario;
  weather: WeatherSnapshot;
  fortune: FortuneSnapshot;
  inspiration: InspirationItem[];
}

export interface OutfitRecommendation {
  id: string;
  itemIds: string[];
  summary: string;
  whyWeatherFit: string;
  whyScenarioFit: string;
  whyFortuneFit: string;
  inspirationIds: string[];
}

export interface RecommendationRequest {
  date: string;
  zodiacSign: ZodiacSign;
  location: LocationInput;
  scenario: CalendarScenario;
}

export interface RecommendationResponse {
  context: ContextSnapshot;
  outfits: OutfitRecommendation[];
  warnings: string[];
}

export interface OutfitDraft {
  itemIds: string[];
  summary: string;
  whyWeatherFit: string;
  whyScenarioFit: string;
  whyFortuneFit: string;
  inspirationIds: string[];
}
