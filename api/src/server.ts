import Fastify, { type FastifyInstance } from "fastify";
import { loadInspirations, loadWardrobe } from "./dataStore.js";
import { CuratedInspirationProvider } from "./providers/curatedInspirationProvider.js";
import { MockCalendarProvider } from "./providers/mockCalendarProvider.js";
import { OpenMeteoProvider } from "./providers/openMeteoProvider.js";
import { AztroFortuneProvider } from "./providers/aztroFortuneProvider.js";
import { RecommendationService } from "./services/recommendationService.js";
import { OpenAIOutfitLLMClient, type OutfitLLMClient } from "./services/outfitGenerator.js";
import {
  ZODIAC_SIGNS,
  type CalendarScenario,
  type RecommendationRequest,
  type WardrobeItem
} from "./types.js";
import type { FortuneProvider } from "./providers/fortuneProvider.js";
import type { InspirationProvider } from "./providers/inspirationProvider.js";
import type { WeatherProvider } from "./providers/weatherProvider.js";
import type { CalendarProvider } from "./providers/calendarProvider.js";

interface BuildAppOptions {
  wardrobe?: WardrobeItem[];
  calendarProvider?: CalendarProvider;
  weatherProvider?: WeatherProvider;
  fortuneProvider?: FortuneProvider;
  inspirationProvider?: InspirationProvider;
  outfitLLMClient?: OutfitLLMClient;
}

function isCalendarScenario(value: unknown): value is CalendarScenario {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CalendarScenario>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.startTime === "string" &&
    typeof candidate.endTime === "string" &&
    typeof candidate.location === "string" &&
    Array.isArray(candidate.occasionTags) &&
    candidate.occasionTags.every((tag) => typeof tag === "string")
  );
}

function parseRecommendationRequest(body: unknown): RecommendationRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const candidate = body as Partial<RecommendationRequest>;
  const zodiacSign = candidate.zodiacSign;

  if (typeof candidate.date !== "string" || Number.isNaN(Date.parse(candidate.date))) {
    throw new Error("`date` must be an ISO date string.");
  }

  if (typeof zodiacSign !== "string" || !ZODIAC_SIGNS.includes(zodiacSign as never)) {
    throw new Error("`zodiacSign` must be a valid zodiac sign.");
  }

  if (
    !candidate.location ||
    typeof candidate.location !== "object" ||
    typeof candidate.location.city !== "string" ||
    typeof candidate.location.lat !== "number" ||
    typeof candidate.location.lon !== "number"
  ) {
    throw new Error("`location` must include city, lat, and lon.");
  }

  if (!isCalendarScenario(candidate.scenario)) {
    throw new Error("`scenario` must match the calendar scenario contract.");
  }

  return {
    date: candidate.date,
    zodiacSign,
    location: candidate.location,
    scenario: candidate.scenario
  };
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const wardrobe = options.wardrobe ?? (await loadWardrobe());
  const inspirations = await loadInspirations();
  const calendarProvider = options.calendarProvider ?? new MockCalendarProvider();
  const weatherProvider = options.weatherProvider ?? new OpenMeteoProvider();
  const fortuneProvider = options.fortuneProvider ?? new AztroFortuneProvider();
  const inspirationProvider =
    options.inspirationProvider ?? new CuratedInspirationProvider(inspirations);
  const outfitLLMClient =
    options.outfitLLMClient ?? new OpenAIOutfitLLMClient(process.env.OPENAI_API_KEY);
  const recommendationService = new RecommendationService({
    wardrobe,
    weatherProvider,
    fortuneProvider,
    inspirationProvider,
    outfitLLMClient
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/v1/wardrobe", async () => ({
    items: wardrobe
  }));

  app.get("/v1/calendar-scenarios", async () => ({
    scenarios: await calendarProvider.listTomorrowScenarios()
  }));

  app.post("/v1/recommendations", async (request, reply) => {
    try {
      const parsed = parseRecommendationRequest(request.body);
      return await recommendationService.recommend(parsed);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Invalid recommendation request."
      });
    }
  });

  return app;
}

async function start(): Promise<void> {
  const app = await buildApp();
  const port = Number(process.env.PORT ?? "8787");
  await app.listen({ host: "0.0.0.0", port });
}

if (process.argv[1]?.endsWith("server.ts")) {
  start().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
