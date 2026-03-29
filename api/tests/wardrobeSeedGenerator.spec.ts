import { buildApp } from "../src/server.js";
import {
  generateWardrobeSeed,
  renderPlaceholderSvg
} from "../src/lib/wardrobeSeedGenerator.js";
import type { WardrobeItem } from "../src/types.js";

describe("wardrobe seed generator", () => {
  it("builds deterministic wardrobe items with metadata and prompts", () => {
    const output = generateWardrobeSeed({
      count: 8,
      seed: 20260328,
      imageBaseUrl: "/generated-assets",
      imageExtension: "svg",
      renderMode: "placeholder",
      personaKeys: ["business", "preppy", "intellectual"]
    });

    expect(output.items).toHaveLength(8);
    expect(output.manifest).toHaveLength(8);
    expect(output.items[0]?.metadata.styleDirection).toBe("电商白底写实风");
    expect(output.items[0]?.metadata.stylePersona).toBeTruthy();
    expect(output.items[0]?.metadata.imagePrompt).toContain("电商白底写实商品图");
    expect(output.items[0]?.imageUrl).toMatch(/^\/generated-assets\/.+\.svg$/);
    expect(output.items.some((item) => item.category === "shoes")).toBe(true);
  });

  it("renders a local placeholder asset for immediate preview", () => {
    const output = generateWardrobeSeed({
      count: 1,
      seed: 7,
      imageBaseUrl: "/generated-assets",
      imageExtension: "svg",
      renderMode: "placeholder",
      personaKeys: ["business"]
    });

    const svg = renderPlaceholderSvg(output.items[0]!);
    expect(svg).toContain("<?xml");
    expect(svg).toContain(output.items[0]!.name);
  });

  it("uses a practical category mix and multiple style directions for 60 items", () => {
    const output = generateWardrobeSeed({
      count: 60,
      seed: 20260328,
      imageBaseUrl: "/generated-assets",
      imageExtension: "svg",
      renderMode: "placeholder",
      personaKeys: ["business", "preppy", "intellectual", "minimal", "french", "urban"]
    });

    const counts = output.items.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] ?? 0) + 1;
      return accumulator;
    }, {});
    const personas = new Set(output.items.map((item) => item.metadata.stylePersona));
    const accessorySubcategories = new Set(
      output.items
        .filter((item) => item.category == "accessory")
        .map((item) => item.metadata.subcategory)
    );

    expect(counts.top).toBe(14);
    expect(counts.bottom).toBe(12);
    expect(counts.shoes).toBe(10);
    expect(counts.outerwear).toBe(8);
    expect(counts.dress).toBe(6);
    expect(counts.accessory).toBe(10);
    expect(personas).toEqual(
      new Set(["商务风", "学院风", "知性风", "极简风", "法式风", "都市风"])
    );
    expect(accessorySubcategories.has("耳饰")).toBe(true);
    expect(accessorySubcategories.has("项链")).toBe(true);
  });

  it("rewrites relative wardrobe asset URLs into absolute API URLs", async () => {
    const wardrobe: WardrobeItem[] = [
      {
        id: "minimal-sneaker-white-01",
        name: "白色极简运动鞋",
        category: "shoes",
        colors: ["white"],
        seasons: ["spring", "summer", "autumn"],
        formality: 2.4,
        warmth: 1.6,
        tags: ["casual", "clean"],
        imageUrl: "/generated-assets/minimal-sneaker-white-01.svg"
      }
    ];

    const app = await buildApp({ wardrobe });
    const response = await app.inject({
      method: "GET",
      url: "/v1/wardrobe",
      headers: {
        host: "127.0.0.1:8787"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items[0]?.imageUrl).toBe(
      "http://127.0.0.1:8787/generated-assets/minimal-sneaker-white-01.svg"
    );

    await app.close();
  });
});
