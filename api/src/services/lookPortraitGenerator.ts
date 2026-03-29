import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  ClothingCategory,
  LookPortraitImage,
  LookPortraitRequest,
  LookPortraitResponse,
  LookPortraitResult,
  WardrobeItem
} from "../types.js";

export interface LookPortraitGenerator {
  generate(request: LookPortraitRequest): Promise<LookPortraitResponse>;
}

interface OpenAILookPortraitGeneratorOptions {
  apiKey?: string;
  wardrobe: WardrobeItem[];
  imageModel?: string;
  imageQuality?: "low" | "medium" | "high";
  imageSize?: "1024x1024" | "1024x1536" | "1536x1024";
}

interface ResolvedInputImage {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

interface CachedLookPortraitManifest {
  cacheKey: string;
  prompt: string;
  files: string[];
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const dataDirectories = [
  resolve(process.cwd(), "..", "data"),
  resolve(process.cwd(), "data"),
  resolve(currentDirectory, "..", "..", "data"),
  resolve(currentDirectory, "..", "..", "..", "data")
];

const generatedImagesDirectories = dataDirectories.map((directory) =>
  resolve(directory, "generated", "images")
);

const generatedLookPortraitDirectories = dataDirectories.map((directory) =>
  resolve(directory, "generated", "look-portraits")
);

const presetReferenceImageCandidates = [
  "model-reference.jpg",
  "model-reference.jpeg",
  "model-reference.png",
  "reference.jpg",
  "reference.jpeg",
  "reference.png"
];

export class OpenAILookPortraitGenerator implements LookPortraitGenerator {
  private readonly apiKey?: string;
  private readonly wardrobeById: Map<string, WardrobeItem>;
  private readonly imageModel: string;
  private readonly imageQuality: "low" | "medium" | "high";
  private readonly imageSize: "1024x1024" | "1024x1536" | "1536x1024";

  constructor(options: OpenAILookPortraitGeneratorOptions) {
    this.apiKey = options.apiKey;
    this.wardrobeById = new Map(options.wardrobe.map((item) => [item.id, item]));
    this.imageModel = options.imageModel ?? process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5";
    this.imageQuality = options.imageQuality ?? "medium";
    this.imageSize = options.imageSize ?? "1024x1536";
  }

  async generate(request: LookPortraitRequest): Promise<LookPortraitResponse> {
    if (!this.apiKey) {
      throw new Error("`OPENAI_API_KEY` 未设置，无法生成真人试穿图。");
    }

    const count = clampCount(request.count ?? 1);
    const warnings: string[] = [];
    const portraits: LookPortraitResult[] = [];
    const referenceImage = await readPresetReferenceImage();

    if (!referenceImage) {
      throw new Error(
        "缺少预设真人参考图。请设置 `OOTD_MODEL_REFERENCE_IMAGE_PATH`，或把参考图放到 `data/reference/model-reference.jpg`。"
      );
    }

    const outputDirectory = await ensureWritableLookPortraitDirectory();
    const referenceSignature = digestBuffer(referenceImage.buffer);

    for (const look of request.looks) {
      const items = look.itemIds
        .map((itemId) => this.wardrobeById.get(itemId))
        .filter((item): item is WardrobeItem => Boolean(item));

      if (!items.length) {
        warnings.push(`look ${look.lookId} 缺少可用衣物，已跳过真人图生成。`);
        continue;
      }

      const clothingImages = await resolveClothingImages(items);
      if (!clothingImages.length) {
        warnings.push(`look ${look.lookId} 缺少可读的单品图片，已跳过真人图生成。`);
        continue;
      }

      const prompt = buildPortraitPrompt({
        city: request.city,
        scenarioTitle: request.scenarioTitle,
        weatherSummary: request.weatherSummary,
        fortuneSummary: request.fortuneSummary,
        lookTitle: look.title,
        items
      });
      const cacheKey = buildPortraitCacheKey({
        city: request.city,
        scenarioTitle: request.scenarioTitle,
        weatherSummary: request.weatherSummary,
        fortuneSummary: request.fortuneSummary,
        lookTitle: look.title,
        itemIds: look.itemIds,
        referenceSignature,
        imageModel: this.imageModel,
        imageQuality: this.imageQuality,
        imageSize: this.imageSize
      });
      const cachedImages = await readCachedPortraitImages(outputDirectory, cacheKey, look.lookId, count);

      if (cachedImages.length >= count) {
        portraits.push({
          lookId: look.lookId,
          images: cachedImages.slice(0, count)
        });
        continue;
      }

      const formData = new FormData();
      formData.set("model", this.imageModel);
      formData.set("prompt", prompt);
      formData.set("size", this.imageSize);
      formData.set("quality", this.imageQuality);
      formData.set("n", String(count));
      formData.set("input_fidelity", "high");
      formData.set("output_format", "png");
      formData.set("background", "opaque");
      formData.append("image[]", toFile(referenceImage));

      for (const clothingImage of clothingImages.slice(0, 5)) {
        formData.append("image[]", toFile(clothingImage));
      }

      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `OpenAI 真人试穿图生成失败 (${response.status}) [${look.lookId}]: ${
            errorBody || "empty response body"
          }`
        );
      }

      const body = (await response.json()) as {
        data?: Array<{ b64_json?: string }>;
      };

      const generatedImages: LookPortraitImage[] = [];
      for (const [index, image] of (body.data ?? []).entries()) {
        if (!image.b64_json) {
          continue;
        }

        const fileName = `${cacheKey}-${index + 1}.png`;
        await writeFile(resolve(outputDirectory, fileName), Buffer.from(image.b64_json, "base64"));
        generatedImages.push({
          id: `${look.lookId}-${index + 1}`,
          imageUrl: `/generated-look-portraits/${fileName}`,
          prompt
        });
      }

      if (!generatedImages.length) {
        warnings.push(`look ${look.lookId} 没有拿到可写入的真人图结果。`);
        continue;
      }

      await writeCachedPortraitManifest(outputDirectory, cacheKey, {
        cacheKey,
        prompt,
        files: generatedImages.map((image) => basename(image.imageUrl))
      });

      portraits.push({
        lookId: look.lookId,
        images: generatedImages
      });
    }

    return {
      portraits,
      warnings,
      source: "preset"
    };
  }
}

function clampCount(value: number): number {
  return Math.min(Math.max(Math.trunc(value) || 1, 1), 4);
}

async function resolveClothingImages(items: WardrobeItem[]): Promise<ResolvedInputImage[]> {
  const resolved: ResolvedInputImage[] = [];

  for (const item of items) {
    const image = await resolveWardrobeItemImage(item);
    if (image) {
      resolved.push(image);
    }
  }

  return resolved;
}

async function resolveWardrobeItemImage(item: WardrobeItem): Promise<ResolvedInputImage | null> {
  const fileName = itemImageFileName(item.imageUrl);

  if (fileName) {
    for (const directory of generatedImagesDirectories) {
      const filePath = resolve(directory, fileName);
      try {
        const buffer = await readFile(filePath);
        return {
          fileName,
          mimeType: mimeTypeForFileName(fileName),
          buffer
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
    }
  }

  if (/^https?:\/\//.test(item.imageUrl)) {
    const response = await fetch(item.imageUrl);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      fileName: fileName ?? `${item.id}.png`,
      mimeType: response.headers.get("content-type") ?? mimeTypeForFileName(fileName ?? `${item.id}.png`),
      buffer: Buffer.from(arrayBuffer)
    };
  }

  return null;
}

function itemImageFileName(imageUrl: string): string | null {
  const directName = basename(imageUrl);
  if (directName && directName !== "/" && directName !== "." && extname(directName)) {
    return directName;
  }

  try {
    const parsed = new URL(imageUrl);
    const pathName = basename(parsed.pathname);
    return extname(pathName) ? pathName : null;
  } catch {
    return null;
  }
}

function mimeTypeForFileName(fileName: string): string {
  switch (extname(fileName).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function toFile(image: ResolvedInputImage): File {
  return new File([new Uint8Array(image.buffer)], image.fileName, { type: image.mimeType });
}

function digestBuffer(buffer: Buffer): string {
  return createHash("sha1").update(buffer).digest("hex");
}

function buildPortraitCacheKey(input: {
  city: string;
  scenarioTitle: string;
  weatherSummary: string;
  fortuneSummary: string;
  lookTitle?: string;
  itemIds: string[];
  referenceSignature: string;
  imageModel: string;
  imageQuality: string;
  imageSize: string;
}): string {
  return createHash("sha1")
    .update(
      JSON.stringify({
        city: input.city,
        scenarioTitle: input.scenarioTitle,
        weatherSummary: input.weatherSummary,
        fortuneSummary: input.fortuneSummary,
        lookTitle: input.lookTitle ?? "",
        itemIds: input.itemIds,
        referenceSignature: input.referenceSignature,
        imageModel: input.imageModel,
        imageQuality: input.imageQuality,
        imageSize: input.imageSize
      })
    )
    .digest("hex")
    .slice(0, 24);
}

async function readCachedPortraitImages(
  outputDirectory: string,
  cacheKey: string,
  lookId: string,
  count: number
): Promise<LookPortraitImage[]> {
  try {
    const manifestPath = resolve(outputDirectory, `${cacheKey}.json`);
    const manifest = JSON.parse(
      (await readFile(manifestPath, "utf-8"))
    ) as CachedLookPortraitManifest;

    if (!Array.isArray(manifest.files) || manifest.files.length < count) {
      return [];
    }

    const images: LookPortraitImage[] = [];
    for (const [index, fileName] of manifest.files.slice(0, count).entries()) {
      await stat(resolve(outputDirectory, fileName));
      images.push({
        id: `${lookId}-${index + 1}`,
        imageUrl: `/generated-look-portraits/${fileName}`,
        prompt: manifest.prompt
      });
    }

    return images;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    return [];
  }
}

async function writeCachedPortraitManifest(
  outputDirectory: string,
  cacheKey: string,
  manifest: CachedLookPortraitManifest
): Promise<void> {
  await writeFile(resolve(outputDirectory, `${cacheKey}.json`), JSON.stringify(manifest, null, 2), "utf-8");
}

async function readPresetReferenceImage(): Promise<ResolvedInputImage | null> {
  const configuredPath = process.env.OOTD_MODEL_REFERENCE_IMAGE_PATH;
  const candidatePaths = configuredPath
    ? configuredPath.startsWith("/")
      ? [configuredPath]
      : [
          resolve(process.cwd(), configuredPath),
          ...dataDirectories.map((directory) => resolve(directory, configuredPath))
        ]
    : dataDirectories.flatMap((directory) =>
        presetReferenceImageCandidates.map((fileName) => resolve(directory, "reference", fileName))
      );

  for (const candidatePath of candidatePaths) {
    try {
      await stat(candidatePath);
      const buffer = await readFile(candidatePath);
      const fileName = basename(candidatePath);
      return {
        fileName,
        mimeType: mimeTypeForFileName(fileName),
        buffer
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  if (configuredPath) {
    throw new Error(`找不到参考图: ${configuredPath}`);
  }

  return null;
}

async function ensureWritableLookPortraitDirectory(): Promise<string> {
  for (const directory of generatedLookPortraitDirectories) {
    try {
      await mkdir(directory, { recursive: true });
      return directory;
    } catch {
      continue;
    }
  }

  throw new Error("无法创建真人试穿图输出目录。");
}

function buildPortraitPrompt(input: {
  city: string;
  scenarioTitle: string;
  weatherSummary: string;
  fortuneSummary: string;
  lookTitle?: string;
  items: WardrobeItem[];
}): string {
  const garmentLines = input.items.map((item) => `- ${describeWardrobeItem(item)}`).join("\n");
  const lookTitle = input.lookTitle ? `Look direction: ${input.lookTitle}.\n` : "";

  return [
    "Create a photorealistic full-body fashion photo of the same woman from the first reference image.",
    "Use the following product images as exact wardrobe references. The woman must wear those garments and accessories faithfully.",
    "Preserve the face, body shape, skin tone, hair length, and general identity of the woman from the first image.",
    "Do not add extra garments, extra people, text, collage layouts, or watermarks.",
    "Keep the pose natural, head-to-toe visible, and make the fabric, color, and silhouette match the product references.",
    "Render the full head, hairline, and face clearly. Never crop off the top of the head or any facial features.",
    lookTitle,
    `City: ${input.city}. Scenario: ${input.scenarioTitle}.`,
    `Weather mood: ${input.weatherSummary}. Fortune cue: ${input.fortuneSummary}.`,
    "Wardrobe references:",
    garmentLines
  ].join("\n");
}

function describeWardrobeItem(item: WardrobeItem): string {
  const details = [
    item.name,
    categoryLabel(item.category),
    item.colors.join("/"),
    item.metadata?.subcategory,
    item.metadata?.material,
    item.metadata?.fit
  ].filter(Boolean);

  return details.join(", ");
}

function categoryLabel(category: ClothingCategory): string {
  switch (category) {
    case "top":
      return "top";
    case "bottom":
      return "bottom";
    case "outerwear":
      return "outerwear";
    case "dress":
      return "dress";
    case "shoes":
      return "shoes";
    case "accessory":
      return "accessory";
  }
}
