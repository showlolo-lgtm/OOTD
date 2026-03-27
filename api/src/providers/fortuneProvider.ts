import type { FortuneSnapshot, ZodiacSign } from "../types.js";

export interface FortuneProvider {
  getTomorrowFortune(sign: ZodiacSign): Promise<FortuneSnapshot>;
}
