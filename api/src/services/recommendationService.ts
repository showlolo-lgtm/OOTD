import { buildFallbackOutfits, validateOutfitDrafts, type OutfitLLMClient } from "./outfitGenerator.js";
import type { FortuneProvider } from "../providers/fortuneProvider.js";
import type { InspirationProvider } from "../providers/inspirationProvider.js";
import type { WeatherProvider } from "../providers/weatherProvider.js";
import type {
  FortuneSnapshot,
  ContextSnapshot,
  RerollLookRequest,
  RerollLookResponse,
  RecommendationRequest,
  RecommendationResponse,
  WardrobeItem,
  WeatherSnapshot
} from "../types.js";

export interface RecommendationServiceDeps {
  wardrobe: WardrobeItem[];
  weatherProvider: WeatherProvider;
  fortuneProvider: FortuneProvider;
  inspirationProvider: InspirationProvider;
  outfitLLMClient?: OutfitLLMClient;
}

function fallbackWeather(date: string): WeatherSnapshot {
  return {
    date,
    highC: 22,
    lowC: 15,
    apparentHighC: 22,
    apparentLowC: 15,
    precipitationProbability: 10,
    weatherCode: 1,
    summary: "天气服务不可用，先按温和天气处理。",
    isRainLikely: false,
    styleTags: ["mild", "clean-lines"]
  };
}

function fallbackFortune(sign: RecommendationRequest["zodiacSign"]): FortuneSnapshot {
  return {
    sign,
    summary: "明天适合用一个清晰的颜色重点，整体保持利落和稳定。",
    luckyColor: "olive",
    mood: "steady",
    focus: "clarity",
    energy: "midday"
  };
}

export class RecommendationService {
  constructor(private readonly deps: RecommendationServiceDeps) {}

  async recommend(input: RecommendationRequest): Promise<RecommendationResponse> {
    const warnings: string[] = [];
    const context = await this.buildContext(input, warnings);

    let outfits = [] as RecommendationResponse["outfits"];

    if (this.deps.outfitLLMClient) {
      for (let attempt = 1; attempt <= 2 && outfits.length < 3; attempt += 1) {
        try {
          const drafts = await this.deps.outfitLLMClient.generate({
            ...context,
            wardrobe: this.deps.wardrobe
          });
          const validated = validateOutfitDrafts(drafts, {
            ...context,
            wardrobe: this.deps.wardrobe
          });
          warnings.push(...validated.warnings.map((warning) => `第 ${attempt} 次尝试：${warning}`));
          outfits = validated.outfits.slice(0, 3);
        } catch (error) {
          void error;
          warnings.push(`第 ${attempt} 次尝试：AI 生成穿搭失败。`);
        }
      }
    } else {
      warnings.push("未配置 OPENAI_API_KEY，已跳过 AI 穿搭生成。");
    }

    if (outfits.length < 3) {
      const fallback = buildFallbackOutfits(
        {
          ...context,
          wardrobe: this.deps.wardrobe
        },
        3 - outfits.length,
        outfits
      );
      if (fallback.length > 0) {
        warnings.push(`已用兜底规则补齐 ${fallback.length} 套穿搭。`);
      }
      outfits = [...outfits, ...fallback];
    }

    return {
      context,
      outfits: outfits.slice(0, 3),
      warnings
    };
  }

  async rerollLook(input: RerollLookRequest): Promise<RerollLookResponse> {
    const warnings: string[] = [];
    const context = await this.buildContext(input, warnings);
    const existingKeys = new Set(input.existingOutfits.map((outfit) => this.outfitKey(outfit.itemIds)));
    let outfit = null as RecommendationResponse["outfits"][number] | null;

    if (this.deps.outfitLLMClient) {
      for (let attempt = 1; attempt <= 2 && !outfit; attempt += 1) {
        try {
          const drafts = await this.deps.outfitLLMClient.generate(
            {
              ...context,
              wardrobe: this.deps.wardrobe
            },
            {
              count: 4,
              excludeItemSets: input.existingOutfits.map((existing) => existing.itemIds)
            }
          );
          const validated = validateOutfitDrafts(drafts, {
            ...context,
            wardrobe: this.deps.wardrobe
          });
          warnings.push(...validated.warnings.map((warning) => `第 ${attempt} 次重搭：${warning}`));
          outfit =
            validated.outfits.find(
              (candidate) => !existingKeys.has(this.outfitKey(candidate.itemIds))
            ) ?? null;
        } catch (error) {
          void error;
          warnings.push(`第 ${attempt} 次重搭：AI 生成新搭配失败。`);
        }
      }
    } else {
      warnings.push("未配置 OPENAI_API_KEY，已跳过 AI 重搭。");
    }

    if (!outfit) {
      outfit =
        buildFallbackOutfits(
          {
            ...context,
            wardrobe: this.deps.wardrobe
          },
          1,
          input.existingOutfits
        )[0] ?? null;
      if (outfit) {
        warnings.push("已用兜底规则补出一套新的搭配。");
      }
    }

    if (!outfit) {
      throw new Error("暂时没有找到新的搭配，可以稍后再试。");
    }

    return {
      context,
      outfit: {
        ...outfit,
        id: input.lookId
      },
      warnings
    };
  }

  private async resolveWeather(
    input: RecommendationRequest,
    warnings: string[]
  ): Promise<WeatherSnapshot> {
    try {
      return await this.deps.weatherProvider.getTomorrowWeather(input.location, input.date);
    } catch (error) {
      void error;
      warnings.push("天气服务失败，已改用温和天气兜底。");
      return fallbackWeather(input.date);
    }
  }

  private async resolveFortune(
    input: RecommendationRequest,
    warnings: string[]
  ): Promise<FortuneSnapshot> {
    try {
      return await this.deps.fortuneProvider.getTomorrowFortune(input.zodiacSign);
    } catch (error) {
      void error;
      warnings.push("运势服务失败，已改用中性运势兜底。");
      return fallbackFortune(input.zodiacSign);
    }
  }

  private async buildContext(
    input: RecommendationRequest,
    warnings: string[]
  ): Promise<ContextSnapshot> {
    const weather = await this.resolveWeather(input, warnings);
    const fortune = await this.resolveFortune(input, warnings);
    const inspiration = await this.deps.inspirationProvider.getInspiration({
      scenario: input.scenario,
      weather,
      fortune,
      limit: 5
    });

    return {
      date: input.date,
      scenario: input.scenario,
      weather,
      fortune,
      inspiration
    };
  }

  private outfitKey(itemIds: string[]): string {
    return [...itemIds].sort().join("|");
  }
}
