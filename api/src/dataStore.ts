import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { InspirationItem, WardrobeItem } from "./types.js";

async function readJsonFile<T>(fileName: string): Promise<T> {
  const raw = await readFile(resolve(process.cwd(), "..", "data", fileName), "utf8");
  return JSON.parse(raw) as T;
}

export async function loadWardrobe(): Promise<WardrobeItem[]> {
  return readJsonFile<WardrobeItem[]>(process.env.WARDROBE_DATA_FILE ?? "wardrobe.json");
}

export async function loadInspirations(): Promise<InspirationItem[]> {
  return readJsonFile<InspirationItem[]>(
    process.env.INSPIRATIONS_DATA_FILE ?? "inspirations.json"
  );
}
