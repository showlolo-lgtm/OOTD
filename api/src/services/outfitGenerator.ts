import { fetchJson } from "../lib/http.js";
import {
  desiredFormality,
  isItemWeatherAppropriate,
  normalizeToken,
  scoreWardrobeItem,
  summariseWeatherWindow
} from "../lib/styleRules.js";
import type {
  CalendarScenario,
  ContextSnapshot,
  InspirationItem,
  OutfitDraft,
  OutfitRecommendation,
  WardrobeItem
} from "../types.js";

export interface OutfitGenerationInput extends ContextSnapshot {
  wardrobe: WardrobeItem[];
}

export interface OutfitGenerationOptions {
  count?: number;
  excludeItemSets?: string[][];
}

export interface OutfitLLMClient {
  generate(input: OutfitGenerationInput, options?: OutfitGenerationOptions): Promise<OutfitDraft[]>;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

function categoryMap(items: WardrobeItem[]): Map<WardrobeItem["category"], WardrobeItem[]> {
  return items.reduce((result, item) => {
    const existing = result.get(item.category) ?? [];
    existing.push(item);
    result.set(item.category, existing);
    return result;
  }, new Map<WardrobeItem["category"], WardrobeItem[]>());
}

function hasCoreSilhouette(items: WardrobeItem[]): boolean {
  const categories = new Set(items.map((item) => item.category));
  const hasDressRoute = categories.has("dress") && categories.has("shoes");
  const hasSeparateRoute =
    categories.has("top") && categories.has("bottom") && categories.has("shoes");

  return hasDressRoute || hasSeparateRoute;
}

function normaliseText(value: string | undefined, fallback: string): string {
  return value?.trim() ? value.trim() : fallback;
}

function outfitWeatherAllowed(items: WardrobeItem[], context: ContextSnapshot): boolean {
  if (!items.every((item) => isItemWeatherAppropriate(item, context.weather))) {
    return false;
  }

  const coreItems = items.filter((item) => item.category !== "accessory");
  const averageWarmth =
    coreItems.reduce((total, item) => total + item.warmth, 0) / Math.max(coreItems.length, 1);

  if (context.weather.highC <= 10) return averageWarmth >= 3;
  if (context.weather.highC <= 18) return averageWarmth >= 2;
  if (context.weather.highC >= 28) return averageWarmth <= 2.6;
  return averageWarmth >= 1.6 && averageWarmth <= 3.8;
}

function filterKnownInspirations(
  inspirationIds: string[],
  inspiration: InspirationItem[]
): string[] {
  const allowed = new Set(inspiration.map((item) => item.id));
  return inspirationIds.filter((id) => allowed.has(id));
}

function colorToChinese(color: string): string {
  switch (normalizeToken(color)) {
    case "olive":
      return "橄榄绿";
    case "ink":
      return "墨黑";
    case "cream":
      return "奶油白";
    case "charcoal":
      return "炭灰";
    case "navy":
      return "海军蓝";
    default:
      return color;
  }
}

export function validateOutfitDrafts(
  drafts: OutfitDraft[],
  input: OutfitGenerationInput
): { outfits: OutfitRecommendation[]; warnings: string[] } {
  const wardrobeMap = new Map(input.wardrobe.map((item) => [item.id, item]));
  const warnings: string[] = [];
  const accepted: OutfitRecommendation[] = [];
  const seen = new Set<string>();

  drafts.forEach((draft, index) => {
    const distinctIds = [...new Set(draft.itemIds)];
    const items = distinctIds.map((id) => wardrobeMap.get(id)).filter(Boolean) as WardrobeItem[];

    if (items.length !== distinctIds.length) {
      warnings.push(`AI 第 ${index + 1} 套穿搭引用了不存在的衣柜单品。`);
      return;
    }

    if (!hasCoreSilhouette(items)) {
      warnings.push(`AI 第 ${index + 1} 套穿搭缺少核心搭配结构。`);
      return;
    }

    if (!outfitWeatherAllowed(items, input)) {
      warnings.push(`AI 第 ${index + 1} 套穿搭不适合明天的天气。`);
      return;
    }

    const key = [...distinctIds].sort().join("|");
    if (seen.has(key)) {
      warnings.push(`AI 第 ${index + 1} 套穿搭和其他结果重复了。`);
      return;
    }

    seen.add(key);
    accepted.push({
      id: `ai-look-${accepted.length + 1}`,
      itemIds: distinctIds,
      summary: normaliseText(draft.summary, "一套兼顾场景、天气和运势的完整搭配。"),
      whyWeatherFit: normaliseText(
        draft.whyWeatherFit,
        `这套是按 ${summariseWeatherWindow(input.weather)} 来安排的。`
      ),
      whyScenarioFit: normaliseText(
        draft.whyScenarioFit,
        `整体气质和“${input.scenario.title}”这个场景匹配。`
      ),
      whyFortuneFit: normaliseText(
        draft.whyFortuneFit,
        `它呼应了${colorToChinese(input.fortune.luckyColor)}这个幸运色提示。`
      ),
      inspirationIds: filterKnownInspirations(draft.inspirationIds, input.inspiration)
    });
  });

  return { outfits: accepted, warnings };
}

function buildNarrative(
  scenario: CalendarScenario,
  weatherLine: string,
  fortuneColor: string,
  selectedItems: WardrobeItem[]
): Pick<
  OutfitRecommendation,
  "summary" | "whyWeatherFit" | "whyScenarioFit" | "whyFortuneFit"
> {
  const leadPieces = selectedItems
    .filter((item) => item.category === "top" || item.category === "dress" || item.category === "outerwear")
    .slice(0, 2)
    .map((item) => item.name);

  return {
    summary: `${leadPieces.join("，")}把“${scenario.title}”的状态先搭好了。`,
    whyWeatherFit: `这套按 ${weatherLine} 来安排，覆盖度和轻盈感比较平衡。`,
    whyScenarioFit: `整体正式度接近 ${desiredFormality(
      scenario.occasionTags
    ).toFixed(1)}，和“${scenario.title}”需要的气质相符。`,
    whyFortuneFit: `颜色重点往${colorToChinese(fortuneColor)}靠，让运势提示自然地落进造型里。`
  };
}

function chooseBestAccessory(items: WardrobeItem[], scored: Map<string, number>): WardrobeItem | undefined {
  return [...items].sort((left, right) => (scored.get(right.id) ?? 0) - (scored.get(left.id) ?? 0))[0];
}

function shouldIncludeOuterwear(highC: number, isRainLikely: boolean): boolean {
  return highC <= 22 || isRainLikely;
}

function scoreOutfit(items: WardrobeItem[], scored: Map<string, number>): number {
  return items.reduce((total, item) => total + (scored.get(item.id) ?? 0), 0);
}

export function buildFallbackOutfits(
  input: OutfitGenerationInput,
  count: number,
  existing: OutfitRecommendation[] = []
): OutfitRecommendation[] {
  const scored = new Map(
    input.wardrobe.map((item) => [
      item.id,
      scoreWardrobeItem(item, {
        scenario: input.scenario,
        weather: input.weather,
        luckyColor: input.fortune.luckyColor,
        inspiration: input.inspiration
      })
    ])
  );

  const sortedItems = [...input.wardrobe]
    .filter((item) => isItemWeatherAppropriate(item, input.weather))
    .sort((left, right) => (scored.get(right.id) ?? 0) - (scored.get(left.id) ?? 0));
  const categories = categoryMap(sortedItems);
  const tops = categories.get("top") ?? [];
  const bottoms = categories.get("bottom") ?? [];
  const dresses = categories.get("dress") ?? [];
  const shoes = categories.get("shoes") ?? [];
  const outerwear = categories.get("outerwear") ?? [];
  const accessories = categories.get("accessory") ?? [];
  const results: Array<{ items: WardrobeItem[]; score: number }> = [];
  const existingKeys = new Set(existing.map((outfit) => [...outfit.itemIds].sort().join("|")));

  for (const top of tops.slice(0, 4)) {
    for (const bottom of bottoms.slice(0, 4)) {
      for (const shoe of shoes.slice(0, 3)) {
        const combo = [top, bottom, shoe];
        if (shouldIncludeOuterwear(input.weather.highC, input.weather.isRainLikely) && outerwear[0]) {
          combo.push(outerwear[0]);
        }
        const accessory = chooseBestAccessory(accessories, scored);
        if (accessory) combo.push(accessory);
        results.push({ items: combo, score: scoreOutfit(combo, scored) });
      }
    }
  }

  for (const dress of dresses.slice(0, 2)) {
    for (const shoe of shoes.slice(0, 3)) {
      const combo = [dress, shoe];
      if (shouldIncludeOuterwear(input.weather.highC, input.weather.isRainLikely) && outerwear[1]) {
        combo.push(outerwear[1]);
      }
      const accessory = chooseBestAccessory(accessories, scored);
      if (accessory) combo.push(accessory);
      results.push({ items: combo, score: scoreOutfit(combo, scored) + 8 });
    }
  }

  const weatherLine = summariseWeatherWindow(input.weather);
  const inspirationIds = input.inspiration.slice(0, 2).map((item) => item.id);

  return results
    .sort((left, right) => right.score - left.score)
    .filter(({ items }) => hasCoreSilhouette(items))
    .map(({ items }, index) => {
      const itemIds = items.map((item) => item.id);
      const key = [...itemIds].sort().join("|");
      if (existingKeys.has(key)) {
        return null;
      }

      existingKeys.add(key);
      const narrative = buildNarrative(input.scenario, weatherLine, input.fortune.luckyColor, items);

      return {
        id: `fallback-look-${index + 1}`,
        itemIds,
        inspirationIds,
        ...narrative
      } satisfies OutfitRecommendation;
    })
    .filter((value): value is OutfitRecommendation => value !== null)
    .slice(0, count);
}

export class OpenAIOutfitLLMClient implements OutfitLLMClient {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
  ) {}

  async generate(
    input: OutfitGenerationInput,
    options: OutfitGenerationOptions = {}
  ): Promise<OutfitDraft[]> {
    if (!this.apiKey) {
      return [];
    }

    const desiredCount = Math.min(Math.max(Math.trunc(options.count ?? 3) || 3, 1), 6);
    const excludeItemSets = (options.excludeItemSets ?? []).filter((itemIds) => itemIds.length > 0);

    const wardrobeBrief = input.wardrobe.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      colors: item.colors,
      formality: item.formality,
      warmth: item.warmth,
      tags: item.tags
    }));

    const prompt = {
      context: {
        date: input.date,
        scenario: input.scenario,
        weather: input.weather,
        fortune: input.fortune,
        inspiration: input.inspiration
      },
      wardrobe: wardrobeBrief,
      instructions: [
        "只返回合法 JSON，不要输出 Markdown。",
        `必须生成恰好 ${desiredCount} 套穿搭。`,
        "每套穿搭只能使用现有 wardrobe item id。",
        `${desiredCount} 套穿搭必须彼此不同。`,
        "每套都必须满足 top+bottom+shoes 或 dress+shoes。",
        "所有面向用户的文案都必须使用简体中文。",
        "天气、场景、运势三个理由都要明确写出来。"
      ],
      excludeItemSets
    };

    const response = await fetchJson<OpenAIResponse>("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是一名服装搭配师。请输出只包含 `outfits` 数组的 JSON，不能输出 JSON 之外的任何文本，且所有用户可见文案必须是简体中文。"
          },
          {
            role: "user",
            content: JSON.stringify(prompt)
          }
        ]
      })
    });

    const content = response.choices?.[0]?.message?.content;
    const rawText =
      typeof content === "string"
        ? content
        : content
            ?.filter((chunk) => chunk.type === "text" && chunk.text)
            .map((chunk) => chunk.text)
            .join("") ?? "";
    const cleaned = rawText.trim().replace(/^```json/, "").replace(/```$/, "").trim();

    if (!cleaned) {
      throw new Error("OpenAI 没有返回可用结果。");
    }

    const parsed = JSON.parse(cleaned) as { outfits?: OutfitDraft[] } | OutfitDraft[];
    if (Array.isArray(parsed)) {
      return parsed;
    }

    return parsed.outfits ?? [];
  }
}
