import { normalizeToken, paletteMatchScore, weatherBand } from "../lib/styleRules.js";
import type { InspirationItem } from "../types.js";
import type { InspirationProvider, InspirationProviderInput } from "./inspirationProvider.js";

function scoreInspiration(item: InspirationItem, input: InspirationProviderInput): number {
  let score = 100;
  const weatherTagSet = new Set([weatherBand(input.weather.highC), ...input.weather.styleTags]);
  const occasionTagSet = new Set(input.scenario.occasionTags.map(normalizeToken));
  const inspirationWeatherTags = item.weatherTags.map(normalizeToken);
  const inspirationOccasionTags = item.occasionTags.map(normalizeToken);
  const weatherMatches = inspirationWeatherTags.filter((tag) => weatherTagSet.has(tag)).length;
  const occasionMatches = inspirationOccasionTags.filter((tag) => occasionTagSet.has(tag)).length;

  score += weatherMatches * 18;
  score += occasionMatches * 22;
  score += paletteMatchScore(item.palette, [input.fortune.luckyColor]) * 10;
  score -= Math.abs(item.formality - (occasionMatches > 0 ? 4 : 3)) * 8;
  score -= Math.abs(item.warmth - input.weather.highC / 10) * 2;

  return score;
}

export class CuratedInspirationProvider implements InspirationProvider {
  constructor(private readonly inspirationLibrary: InspirationItem[]) {}

  async getInspiration(input: InspirationProviderInput): Promise<InspirationItem[]> {
    return [...this.inspirationLibrary]
      .sort((left, right) => scoreInspiration(right, input) - scoreInspiration(left, input))
      .slice(0, input.limit ?? 5);
  }
}
