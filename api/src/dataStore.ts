import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { InspirationItem, WardrobeItem } from "./types.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const dataDirectories = [
  resolve(process.cwd(), "..", "data"),
  resolve(process.cwd(), "data"),
  resolve(currentDirectory, "..", "..", "data"),
  resolve(currentDirectory, "..", "..", "..", "data")
];

async function readJsonFile<T>(fileName: string): Promise<T> {
  for (const directory of dataDirectories) {
    try {
      const raw = await readFile(resolve(directory, fileName), "utf8");
      return JSON.parse(raw) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error(`Data file not found: ${fileName}`);
}

export async function loadWardrobe(): Promise<WardrobeItem[]> {
  return readJsonFile<WardrobeItem[]>(process.env.WARDROBE_DATA_FILE ?? "wardrobe.json");
}

export async function loadInspirations(): Promise<InspirationItem[]> {
  return readJsonFile<InspirationItem[]>(
    process.env.INSPIRATIONS_DATA_FILE ?? "inspirations.json"
  );
}
