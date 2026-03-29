import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  generateWardrobeSeed,
  renderPlaceholderSvg,
  type GeneratedImageManifestEntry
} from "../src/lib/wardrobeSeedGenerator.js";

type RenderMode = "placeholder" | "openai";
type ImageQuality = "low" | "medium" | "high";
type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
type StylePersonaCLI =
  | "business"
  | "preppy"
  | "intellectual"
  | "minimal"
  | "french"
  | "urban";
type ClothingCategoryCLI = "top" | "bottom" | "shoes" | "outerwear" | "dress" | "accessory";
const CATEGORY_ALIASES: Record<string, ClothingCategoryCLI> = {
  top: "top",
  上装: "top",
  bottom: "bottom",
  下装: "bottom",
  shoes: "shoes",
  鞋: "shoes",
  鞋履: "shoes",
  outerwear: "outerwear",
  外套: "outerwear",
  dress: "dress",
  连衣裙: "dress",
  accessory: "accessory",
  配饰: "accessory"
};
const PERSONA_ALIASES: Record<string, StylePersonaCLI> = {
  business: "business",
  商务风: "business",
  preppy: "preppy",
  学院风: "preppy",
  intellectual: "intellectual",
  知性风: "intellectual",
  minimal: "minimal",
  极简风: "minimal",
  french: "french",
  法式风: "french",
  urban: "urban",
  都市风: "urban"
};

interface CLIOptions {
  count: number;
  seed: number;
  mode: RenderMode;
  imageBaseUrl: string;
  quality: ImageQuality;
  size: ImageSize;
  personas: StylePersonaCLI[];
  categoryCounts?: Partial<Record<ClothingCategoryCLI, number>>;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const dataRoot = resolve(process.cwd(), "..", "data");
  const generatedDir = resolve(dataRoot, "generated");
  const imagesDir = resolve(generatedDir, "images");
  const imageExtension = options.mode === "openai" ? "png" : "svg";
  const output = generateWardrobeSeed({
    count: options.count,
    seed: options.seed,
    imageBaseUrl: options.imageBaseUrl,
    imageExtension,
    renderMode: options.mode,
    personaKeys: options.personas,
    categoryCounts: options.categoryCounts
  });

  await mkdir(imagesDir, { recursive: true });

  if (options.mode === "placeholder") {
    await Promise.all(
      output.items.map(async (item) => {
        await writeFile(resolve(imagesDir, `${item.id}.svg`), renderPlaceholderSvg(item), "utf8");
      })
    );
  } else {
    await generateImagesWithOpenAI(output.manifest, dataRoot, options);
  }

  await writeFile(
    resolve(generatedDir, "wardrobe.generated.json"),
    `${JSON.stringify(output.items, null, 2)}\n`
  );
  await writeFile(
    resolve(generatedDir, "image-manifest.generated.json"),
    `${JSON.stringify(output.manifest, null, 2)}\n`
  );

  console.log(`已生成 ${output.items.length} 件单品。`);
  console.log(`衣柜数据: ${resolve(generatedDir, "wardrobe.generated.json")}`);
  console.log(`图片清单: ${resolve(generatedDir, "image-manifest.generated.json")}`);
  console.log(`图片目录: ${imagesDir}`);
}

async function generateImagesWithOpenAI(
  manifest: GeneratedImageManifestEntry[],
  dataRoot: string,
  options: Pick<CLIOptions, "quality" | "size">
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  const imageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5";

  if (!apiKey) {
    throw new Error("`OPENAI_API_KEY` 未设置，无法进入 openai 图片生成模式。");
  }

  for (const entry of manifest) {
    const filePath = resolve(dataRoot, entry.outputPath);
    const payload = {
      model: imageModel,
      prompt: `${entry.prompt}${entry.negativePrompt}`,
      size: options.size,
      quality: options.quality,
      background: "opaque",
      output_format: "png"
    };

    console.log(`正在生成 ${entry.itemId} -> ${filePath}`);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI 图片生成失败 (${response.status}) [${entry.itemId}]: ${errorBody || "empty response body"}`
      );
    }

    const body = (await response.json()) as {
      data?: Array<{ b64_json?: string }>;
    };
    const encoded = body.data?.[0]?.b64_json;

    if (!encoded) {
      throw new Error(`OpenAI 未返回可写入的图片数据: ${entry.itemId}`);
    }

    await writeFile(filePath, Buffer.from(encoded, "base64"));
  }
}

function parseArgs(args: string[]): CLIOptions {
  const defaults: CLIOptions = {
    count: 24,
    seed: Number(new Date().toISOString().slice(0, 10).replaceAll("-", "")),
    mode: "placeholder",
    imageBaseUrl: "/generated-assets",
    quality: "medium",
    size: "1024x1536",
    personas: ["business", "preppy", "intellectual", "minimal", "french", "urban"]
  };

  let index = 0;
  while (index < args.length) {
    const arg = args[index];
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }

    const value = args[index + 1];
    if (!value) {
      throw new Error(`参数 ${arg} 缺少值。`);
    }

    switch (arg) {
      case "--count":
        defaults.count = parsePositiveInteger(value, "--count");
        index += 2;
        break;
      case "--seed":
        defaults.seed = parsePositiveInteger(value, "--seed");
        index += 2;
        break;
      case "--mode":
        if (value !== "placeholder" && value !== "openai") {
          throw new Error("`--mode` 只支持 `placeholder` 或 `openai`。");
        }
        defaults.mode = value;
        index += 2;
        break;
      case "--image-base-url":
        defaults.imageBaseUrl = value;
        index += 2;
        break;
      case "--quality":
        if (value !== "low" && value !== "medium" && value !== "high") {
          throw new Error("`--quality` 只支持 `low`、`medium` 或 `high`。");
        }
        defaults.quality = value;
        index += 2;
        break;
      case "--size":
        if (value !== "1024x1024" && value !== "1024x1536" && value !== "1536x1024") {
          throw new Error("`--size` 只支持 `1024x1024`、`1024x1536` 或 `1536x1024`。");
        }
        defaults.size = value;
        index += 2;
        break;
      case "--styles":
      case "--personas":
        defaults.personas = parsePersonas(value);
        if (!defaults.personas.length) {
          throw new Error("`--personas` 至少要包含一个服装风格。");
        }
        index += 2;
        break;
      case "--category-counts":
        defaults.categoryCounts = parseCategoryCounts(value);
        defaults.count = Object.values(defaults.categoryCounts).reduce(
          (sum, itemCount) => sum + itemCount,
          0
        );
        index += 2;
        break;
      default:
        throw new Error(`未知参数: ${arg}`);
    }
  }

  return defaults;
}

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} 必须是正整数。`);
  }
  return parsed;
}

function printHelp(): void {
  console.log(`用法:
  pnpm generate:wardrobe
  pnpm generate:wardrobe --count 36 --seed 20260328
  OPENAI_API_KEY=sk-... pnpm generate:wardrobe --mode openai --category-counts top=14,bottom=12,shoes=10,outerwear=8,dress=6,accessory=10 --personas 商务风,学院风,知性风,极简风,法式风,都市风

参数:
  --count <n>            生成单品数量，默认 24
  --seed <n>             随机种子，默认当天日期
  --mode <mode>          placeholder 或 openai，默认 placeholder
  --quality <level>      图片质量 low / medium / high，默认 medium
  --size <size>          图片尺寸，默认 1024x1536
  --category-counts      分类数量，例如 top=14,bottom=12,shoes=10,outerwear=8,dress=6,accessory=10
  --personas <list>      服装风格，逗号分隔，可用 商务风,学院风,知性风,极简风,法式风,都市风
  --image-base-url <url> 返回给客户端的图片前缀，默认 /generated-assets`);
}

function parseCategoryCounts(value: string): Partial<Record<ClothingCategoryCLI, number>> {
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const counts: Partial<Record<ClothingCategoryCLI, number>> = {};

  for (const entry of entries) {
    const [rawKey, rawValue] = entry.split("=");
    const category = CATEGORY_ALIASES[rawKey?.trim() ?? ""];
    if (!category) {
      throw new Error(`未知分类: ${rawKey}`);
    }
    const parsed = parsePositiveInteger(rawValue?.trim() ?? "", `分类 ${rawKey}`);
    counts[category] = parsed;
  }

  return counts;
}

function parsePersonas(value: string): StylePersonaCLI[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const persona = PERSONA_ALIASES[entry];
      if (!persona) {
        throw new Error(`未知服装风格: ${entry}`);
      }
      return persona;
    });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
