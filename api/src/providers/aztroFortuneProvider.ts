import { fetchJson } from "../lib/http.js";
import type { FortuneSnapshot, ZodiacSign } from "../types.js";
import type { FortuneProvider } from "./fortuneProvider.js";

interface AztroResponse {
  description?: string;
  color?: string;
  mood?: string;
  compatibility?: string;
  lucky_time?: string;
}

function colorToChinese(color: string): string {
  switch (color) {
    case "olive":
      return "橄榄绿";
    case "ink":
      return "墨黑";
    case "cream":
      return "奶油白";
    default:
      return color;
  }
}

function moodToChinese(mood: string): string {
  switch (mood.toLowerCase()) {
    case "steady":
      return "稳定";
    case "dreamy":
      return "轻盈";
    case "intentional":
      return "笃定";
    case "grounded":
      return "沉稳";
    default:
      return "从容";
  }
}

function normalizeColor(raw: string | undefined): string {
  if (!raw || raw.trim().length === 0) {
    return "olive";
  }

  return raw.trim().toLowerCase();
}

export function normalizeAztroPayload(
  payload: AztroResponse,
  sign: ZodiacSign
): FortuneSnapshot {
  const description = payload.description?.trim();

  if (!description) {
    throw new Error("Aztro 返回结果里缺少运势描述");
  }

  const luckyColor = normalizeColor(payload.color);
  const mood = payload.mood?.trim() || "steady";

  return {
    sign,
    summary: `明天适合用${colorToChinese(luckyColor)}做点缀，整体节奏以${moodToChinese(mood)}为主。`,
    luckyColor,
    mood,
    focus: payload.compatibility?.trim() || "self-trust",
    energy: payload.lucky_time?.trim() || "midday"
  };
}

export class AztroFortuneProvider implements FortuneProvider {
  async getTomorrowFortune(sign: ZodiacSign): Promise<FortuneSnapshot> {
    const url = `https://aztro.sameerkumar.website/?sign=${sign}&day=tomorrow`;
    const payload = await fetchJson<AztroResponse>(url, { method: "POST" });
    return normalizeAztroPayload(payload, sign);
  }
}
