import { buildApp } from "../src/server.js";
import { normalizeAztroPayload } from "../src/providers/aztroFortuneProvider.js";
import { CuratedInspirationProvider } from "../src/providers/curatedInspirationProvider.js";
import { normalizeOpenMeteoForecast } from "../src/providers/openMeteoProvider.js";
import { buildFallbackOutfits, validateOutfitDrafts } from "../src/services/outfitGenerator.js";
import type {
  FortuneSnapshot,
  OutfitDraft,
  RecommendationRequest,
  WardrobeItem,
  WeatherSnapshot
} from "../src/types.js";

const wardrobe = [
  {
    id: "shirt-oxford-ivory",
    name: "Ivory Oxford Shirt",
    category: "top",
    colors: ["ivory", "cream"],
    seasons: ["spring", "autumn"],
    formality: 4.5,
    warmth: 2.2,
    tags: ["office", "commute", "tailored"],
    imageUrl: "https://placehold.co/640x800/EEE6DA/2A2E35?text=Ivory+Oxford"
  },
  {
    id: "trouser-charcoal-wide",
    name: "Charcoal Wide-Leg Trouser",
    category: "bottom",
    colors: ["charcoal"],
    seasons: ["spring", "autumn", "winter"],
    formality: 4.6,
    warmth: 2.8,
    tags: ["office", "tailored", "boardroom"],
    imageUrl: "https://placehold.co/640x800/D8D8D8/1F2430?text=Charcoal+Trouser"
  },
  {
    id: "loafer-black-soft",
    name: "Soft Black Loafers",
    category: "shoes",
    colors: ["black"],
    seasons: ["spring", "autumn", "winter"],
    formality: 4.2,
    warmth: 2.4,
    tags: ["office", "commute", "rain-ready"],
    imageUrl: "https://placehold.co/640x800/282828/F4F0E8?text=Black+Loafer"
  },
  {
    id: "blazer-navy-relaxed",
    name: "Relaxed Navy Blazer",
    category: "outerwear",
    colors: ["navy"],
    seasons: ["spring", "autumn"],
    formality: 4.7,
    warmth: 3,
    tags: ["office", "meeting", "layered"],
    imageUrl: "https://placehold.co/640x800/33435C/F2E9DD?text=Navy+Blazer"
  },
  {
    id: "dress-slip-olive",
    name: "Olive Slip Dress",
    category: "dress",
    colors: ["olive"],
    seasons: ["spring", "summer", "autumn"],
    formality: 3.7,
    warmth: 1.8,
    tags: ["date", "gallery", "sleek"],
    imageUrl: "https://placehold.co/640x800/768060/F8F3E8?text=Olive+Slip+Dress"
  },
  {
    id: "heel-slingback-cream",
    name: "Cream Slingback Heels",
    category: "shoes",
    colors: ["cream"],
    seasons: ["spring", "summer", "autumn"],
    formality: 4.1,
    warmth: 1.2,
    tags: ["date", "dressy"],
    imageUrl: "https://placehold.co/640x800/F0E4D8/2F2A29?text=Cream+Slingback"
  },
  {
    id: "bag-structured-olive",
    name: "Structured Olive Tote",
    category: "accessory",
    colors: ["olive"],
    seasons: ["spring", "autumn", "winter"],
    formality: 4.3,
    warmth: 2,
    tags: ["office", "commute", "practical"],
    imageUrl: "https://placehold.co/640x800/55624A/F9F3E7?text=Olive+Tote"
  }
] satisfies WardrobeItem[];

const weather = {
  date: "2026-03-27",
  highC: 17,
  lowC: 9,
  apparentHighC: 16,
  apparentLowC: 8,
  precipitationProbability: 68,
  weatherCode: 63,
  summary: "Rain sweeping through the day",
  isRainLikely: true,
  styleTags: ["rainy", "cool", "layered"]
} satisfies WeatherSnapshot;

const fortune = {
  sign: "aries",
  summary: "Green undertones and calm polish help you move quickly without looking rushed.",
  luckyColor: "olive",
  mood: "grounded",
  focus: "clarity",
  energy: "midday"
} satisfies FortuneSnapshot;

const inspirations = [
  {
    id: "xhs-rain-commute",
    title: "Rainy tailored commute",
    sourceName: "Curated Xiaohongshu notes",
    sourceUrl: "https://www.xiaohongshu.com/",
    summary: "Sharp blazer, grounded tones, rain-ready leather shoes.",
    weatherTags: ["rainy", "cool"],
    occasionTags: ["office", "commute"],
    palette: ["olive", "charcoal", "navy"],
    formality: 4.4,
    warmth: 2.8,
    vibe: "polished",
    keywords: ["tailored", "layered", "practical"]
  },
  {
    id: "xhs-date-gallery",
    title: "Gallery-night minimalism",
    sourceName: "Curated Xiaohongshu notes",
    sourceUrl: "https://www.xiaohongshu.com/",
    summary: "Slip dress plus restrained accessories.",
    weatherTags: ["mild", "warm"],
    occasionTags: ["date", "gallery"],
    palette: ["olive", "cream"],
    formality: 3.8,
    warmth: 1.6,
    vibe: "sleek",
    keywords: ["sleek", "quiet-luxury"]
  }
];

const scenario = {
  id: "client-rainy",
  title: "Client workshop downtown",
  startTime: "2026-03-27T02:30:00.000Z",
  endTime: "2026-03-27T10:00:00.000Z",
  location: "Xuhui client office",
  occasionTags: ["office", "client", "meeting", "boardroom"]
};

describe("provider normalization", () => {
  it("normalizes Open-Meteo daily payloads", () => {
    const normalized = normalizeOpenMeteoForecast(
      {
        daily: {
          time: ["2026-03-26", "2026-03-27"],
          weather_code: [1, 63],
          temperature_2m_max: [20, 17],
          temperature_2m_min: [12, 9],
          apparent_temperature_max: [19, 16],
          apparent_temperature_min: [11, 8],
          precipitation_probability_max: [20, 68]
        }
      },
      "2026-03-27"
    );

    expect(normalized.summary).toContain("阵雨");
    expect(normalized.isRainLikely).toBe(true);
    expect(normalized.highC).toBe(17);
  });

  it("normalizes Aztro payloads", () => {
    const normalized = normalizeAztroPayload(
      {
        description: "Let one calm statement piece do the work.",
        color: "Olive",
        mood: "intentional",
        compatibility: "Libra",
        lucky_time: "11am"
      },
      "aries"
    );

    expect(normalized.luckyColor).toBe("olive");
    expect(normalized.focus).toBe("Libra");
  });
});

describe("inspiration and outfit generation", () => {
  it("ranks inspirations with weather and occasion bias", async () => {
    const provider = new CuratedInspirationProvider(inspirations);
    const ranked = await provider.getInspiration({
      scenario,
      weather,
      fortune,
      limit: 2
    });

    expect(ranked[0]?.id).toBe("xhs-rain-commute");
  });

  it("rejects duplicate and weather-incompatible AI outfits", () => {
    const drafts: OutfitDraft[] = [
      {
        itemIds: ["shirt-oxford-ivory", "trouser-charcoal-wide", "loafer-black-soft"],
        summary: "Tailored commute look",
        whyWeatherFit: "Rainy-ready.",
        whyScenarioFit: "Boardroom sharp.",
        whyFortuneFit: "Olive accent.",
        inspirationIds: ["xhs-rain-commute"]
      },
      {
        itemIds: ["shirt-oxford-ivory", "trouser-charcoal-wide", "loafer-black-soft"],
        summary: "Duplicate look",
        whyWeatherFit: "Rainy-ready.",
        whyScenarioFit: "Boardroom sharp.",
        whyFortuneFit: "Olive accent.",
        inspirationIds: ["xhs-rain-commute"]
      },
      {
        itemIds: ["dress-slip-olive", "heel-slingback-cream"],
        summary: "Too light for cold rain",
        whyWeatherFit: "Not actually weather-safe.",
        whyScenarioFit: "Date-coded.",
        whyFortuneFit: "Green accent.",
        inspirationIds: ["xhs-date-gallery"]
      }
    ];

    const validated = validateOutfitDrafts(drafts, {
      date: "2026-03-27",
      scenario,
      weather,
      fortune,
      inspiration: inspirations,
      wardrobe
    });

    expect(validated.outfits).toHaveLength(1);
    expect(validated.warnings).toHaveLength(2);
  });

  it("builds fallback outfits when AI is unavailable", () => {
    const fallback = buildFallbackOutfits(
      {
        date: "2026-03-27",
        scenario,
        weather,
        fortune,
        inspiration: inspirations,
        wardrobe
      },
      3
    );

    expect(fallback).toHaveLength(3);
    expect(new Set(fallback.map((item) => item.itemIds.sort().join("|"))).size).toBe(3);
  });
});

describe("api contract", () => {
  it("returns contract-safe recommendations", async () => {
    const app = await buildApp({
      wardrobe,
      weatherProvider: {
        getTomorrowWeather: async () => weather
      },
      fortuneProvider: {
        getTomorrowFortune: async () => fortune
      },
      inspirationProvider: {
        getInspiration: async () => inspirations
      },
      outfitLLMClient: {
        generate: async () => []
      }
    });

    const payload: RecommendationRequest = {
      date: "2026-03-27",
      zodiacSign: "aries",
      location: {
        city: "Shanghai",
        lat: 31.2304,
        lon: 121.4737
      },
      scenario
    };

    const response = await app.inject({
      method: "POST",
      url: "/v1/recommendations",
      payload
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      outfits: Array<{ itemIds: string[]; inspirationIds: string[] }>;
    };
    const wardrobeIds = new Set(wardrobe.map((item) => item.id));
    const inspirationIds = new Set(inspirations.map((item) => item.id));

    expect(body.outfits).toHaveLength(3);
    body.outfits.forEach((outfit) => {
      outfit.itemIds.forEach((itemId) => expect(wardrobeIds.has(itemId)).toBe(true));
      outfit.inspirationIds.forEach((inspirationId) =>
        expect(inspirationIds.has(inspirationId)).toBe(true)
      );
    });

    await app.close();
  });
});
