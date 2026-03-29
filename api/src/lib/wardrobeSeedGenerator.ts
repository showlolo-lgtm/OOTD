import type {
  ClothingCategory,
  WardrobeItem,
  WardrobeItemMetadata
} from "../types.js";

type SeededRandom = () => number;

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  inkHex: string;
}

interface TemplateSpec {
  slug: string;
  name: string;
  subcategory: string;
  material: string;
  pattern: string;
  fit: string;
  silhouette: string;
  seasons: string[];
  baseFormality: number;
  baseWarmth: number;
  tags: string[];
  keywords: string[];
  promptShape: string;
  supportedColors?: string[];
  heelHeightCm?: number;
  shaftHeight?: string;
  waterproof?: boolean;
}

type StylePersonaKey =
  | "business"
  | "preppy"
  | "intellectual"
  | "minimal"
  | "french"
  | "urban";

interface StylePersonaProfile {
  key: StylePersonaKey;
  name: string;
  description: string;
  promptHint: string;
  tags: string[];
  preferredCategories?: ClothingCategory[];
}

export interface GeneratedImageManifestEntry {
  itemId: string;
  fileName: string;
  outputPath: string;
  imageUrl: string;
  styleDirection: string;
  prompt: string;
  negativePrompt: string;
  renderMode: "placeholder" | "openai";
}

export interface GeneratedWardrobeItem extends WardrobeItem {
  metadata: WardrobeItemMetadata;
}

export interface WardrobeSeedOutput {
  items: GeneratedWardrobeItem[];
  manifest: GeneratedImageManifestEntry[];
}

export interface WardrobeSeedOptions {
  count: number;
  seed: number;
  imageBaseUrl: string;
  imageExtension: "svg" | "png";
  renderMode: "placeholder" | "openai";
  personaKeys: StylePersonaKey[];
  categoryCounts?: Partial<Record<ClothingCategory, number>>;
}

const COLORS: ColorOption[] = [
  { id: "ivory", name: "象牙白", hex: "#F5EFE6", inkHex: "#2C2A28" },
  { id: "cream", name: "奶油白", hex: "#F3E7D8", inkHex: "#342C28" },
  { id: "pearl", name: "珍珠白", hex: "#F7F3EF", inkHex: "#3A3430" },
  { id: "stone", name: "石灰色", hex: "#D8CEC1", inkHex: "#312F2D" },
  { id: "oat", name: "燕麦色", hex: "#D9CDB8", inkHex: "#342D25" },
  { id: "camel", name: "驼色", hex: "#B9916C", inkHex: "#FAF6EE" },
  { id: "mocha", name: "摩卡色", hex: "#8C6954", inkHex: "#FBF5EE" },
  { id: "charcoal", name: "炭灰", hex: "#4B4E55", inkHex: "#FAFAF7" },
  { id: "black", name: "黑色", hex: "#1F2023", inkHex: "#FAFAF7" },
  { id: "silver", name: "银色", hex: "#C8CDD3", inkHex: "#2B3137" },
  { id: "gold", name: "金色", hex: "#D3B062", inkHex: "#2F281D" },
  { id: "navy", name: "海军蓝", hex: "#334562", inkHex: "#F7F3EB" },
  { id: "ink", name: "墨蓝", hex: "#253447", inkHex: "#F8F4EC" },
  { id: "sage", name: "鼠尾草绿", hex: "#98A98D", inkHex: "#F7F3EB" },
  { id: "olive", name: "橄榄绿", hex: "#667356", inkHex: "#F9F6EE" },
  { id: "moss", name: "苔绿色", hex: "#74815F", inkHex: "#F8F5EE" },
  { id: "forest", name: "森林绿", hex: "#395444", inkHex: "#F8F5EE" },
  { id: "dusty-rose", name: "雾粉色", hex: "#C69A97", inkHex: "#312828" },
  { id: "wine", name: "酒红色", hex: "#6B2F39", inkHex: "#F8F3EE" },
  { id: "taupe", name: "灰褐色", hex: "#9A887A", inkHex: "#FBF7F0" },
  { id: "white", name: "白色", hex: "#FAFAF7", inkHex: "#222222" }
];

const IMAGE_STYLE_DIRECTION = "电商白底写实风";

const DEFAULT_CATEGORY_COUNTS: Record<ClothingCategory, number> = {
  top: 14,
  bottom: 12,
  shoes: 10,
  outerwear: 8,
  dress: 6,
  accessory: 10
};

const STYLE_PERSONA_PROFILES: Record<StylePersonaKey, StylePersonaProfile> = {
  business: {
    key: "business",
    name: "商务风",
    description: "强调通勤、会议、干练线条和可信赖感。",
    promptHint: "风格偏商务风，线条干净克制，适合办公室与正式会面。",
    tags: ["business", "office", "polished"],
    preferredCategories: ["top", "bottom", "outerwear", "shoes", "accessory"]
  },
  preppy: {
    key: "preppy",
    name: "学院风",
    description: "强调清爽、规整、带一点书卷气和校园感。",
    promptHint: "风格偏学院风，清爽规整，带一点书卷气和减龄感。",
    tags: ["preppy", "clean", "youthful"],
    preferredCategories: ["top", "bottom", "dress", "outerwear", "shoes", "accessory"]
  },
  intellectual: {
    key: "intellectual",
    name: "知性风",
    description: "强调温和、克制、成熟感和阅读气质。",
    promptHint: "风格偏知性风，温和克制，强调成熟感与阅读气质。",
    tags: ["intellectual", "refined", "calm"],
    preferredCategories: ["top", "bottom", "dress", "outerwear", "shoes", "accessory"]
  },
  minimal: {
    key: "minimal",
    name: "极简风",
    description: "强调去装饰、干净轮廓和耐看的基础感。",
    promptHint: "风格偏极简风，减少装饰，强调干净轮廓和高级基础感。",
    tags: ["minimal", "clean", "timeless"],
    preferredCategories: ["top", "bottom", "outerwear", "dress", "shoes", "accessory"]
  },
  french: {
    key: "french",
    name: "法式风",
    description: "强调轻松优雅、微松弛和女性化线条。",
    promptHint: "风格偏法式风，轻松优雅，带一点松弛和女性化线条。",
    tags: ["french", "elegant", "soft"],
    preferredCategories: ["top", "bottom", "dress", "shoes", "accessory"]
  },
  urban: {
    key: "urban",
    name: "都市风",
    description: "强调现代、利落、适合城市移动与日常切换。",
    promptHint: "风格偏都市风，现代利落，适合高频城市通勤和日常切换。",
    tags: ["urban", "modern", "city"],
    preferredCategories: ["top", "bottom", "outerwear", "shoes", "accessory"]
  }
};

const TEMPLATE_SPECS: Record<ClothingCategory, TemplateSpec[]> = {
  top: [
    {
      slug: "silk-shirt",
      name: "真丝衬衫",
      subcategory: "衬衫",
      material: "真丝",
      pattern: "纯色",
      fit: "常规",
      silhouette: "微垂坠",
      seasons: ["spring", "summer", "autumn"],
      baseFormality: 4.4,
      baseWarmth: 1.5,
      tags: ["office", "commute", "polished"],
      keywords: ["极简", "通勤", "轻熟"],
      promptShape: "单件女士衬衫，领口清晰，袖型利落，面料带细腻光泽。",
      supportedColors: ["ivory", "cream", "sage", "dusty-rose", "ink"]
    },
    {
      slug: "rib-knit-tee",
      name: "罗纹针织上衣",
      subcategory: "针织上衣",
      material: "细针织",
      pattern: "罗纹",
      fit: "修身",
      silhouette: "贴身",
      seasons: ["spring", "summer", "autumn"],
      baseFormality: 3.2,
      baseWarmth: 1.8,
      tags: ["casual", "clean", "minimal"],
      keywords: ["基础款", "都市", "干净"],
      promptShape: "单件女士罗纹上衣，肩线干净，版型修长，针织纹理可见。",
      supportedColors: ["stone", "oat", "camel", "navy", "white"]
    },
    {
      slug: "merino-knit",
      name: "羊毛针织衫",
      subcategory: "针织衫",
      material: "美利奴羊毛",
      pattern: "纯色",
      fit: "微宽松",
      silhouette: "柔和垂落",
      seasons: ["autumn", "winter", "spring"],
      baseFormality: 3.8,
      baseWarmth: 3.7,
      tags: ["office", "layered", "soft"],
      keywords: ["柔软", "叠穿", "秋冬"],
      promptShape: "单件女士针织衫，羊毛质感明显，领口和袖口干净平整。",
      supportedColors: ["mocha", "camel", "charcoal", "wine", "olive"]
    }
  ],
  bottom: [
    {
      slug: "wide-trouser",
      name: "阔腿西裤",
      subcategory: "西裤",
      material: "斜纹西装料",
      pattern: "纯色",
      fit: "高腰",
      silhouette: "阔腿",
      seasons: ["spring", "autumn", "winter"],
      baseFormality: 4.6,
      baseWarmth: 2.8,
      tags: ["office", "tailored", "boardroom"],
      keywords: ["利落", "通勤", "大女人"],
      promptShape: "单条女士高腰西裤，裤线利落，裤腿宽松顺直，垂感明显。",
      supportedColors: ["charcoal", "navy", "taupe", "black"]
    },
    {
      slug: "a-line-midi-skirt",
      name: "A 字中长裙",
      subcategory: "半裙",
      material: "哑光混纺",
      pattern: "纯色",
      fit: "高腰",
      silhouette: "A 字",
      seasons: ["spring", "summer", "autumn"],
      baseFormality: 3.8,
      baseWarmth: 1.8,
      tags: ["date", "gallery", "soft"],
      keywords: ["法式", "轻盈", "约会"],
      promptShape: "单条女士中长半裙，裙摆轻微展开，线条顺滑，不规则细节极少。",
      supportedColors: ["olive", "moss", "dusty-rose", "cream", "wine"]
    },
    {
      slug: "straight-denim",
      name: "直筒牛仔裤",
      subcategory: "牛仔裤",
      material: "丹宁",
      pattern: "纯色",
      fit: "高腰",
      silhouette: "直筒",
      seasons: ["spring", "autumn", "winter"],
      baseFormality: 2.8,
      baseWarmth: 2.4,
      tags: ["casual", "weekend", "city"],
      keywords: ["街头", "基础款", "利落"],
      promptShape: "单条女士直筒牛仔裤，丹宁纹理清楚，腰线简洁，裤脚利落。",
      supportedColors: ["ink", "navy", "charcoal"]
    }
  ],
  outerwear: [
    {
      slug: "belted-blazer",
      name: "收腰西装外套",
      subcategory: "西装外套",
      material: "羊毛混纺",
      pattern: "纯色",
      fit: "修身",
      silhouette: "收腰",
      seasons: ["spring", "autumn"],
      baseFormality: 4.7,
      baseWarmth: 3,
      tags: ["office", "meeting", "layered"],
      keywords: ["权威", "精致", "通勤"],
      promptShape: "单件女士西装外套，肩线挺括，腰部略收，驳领清晰。",
      supportedColors: ["navy", "ink", "charcoal", "taupe"]
    },
    {
      slug: "short-trench",
      name: "短款风衣",
      subcategory: "风衣",
      material: "防泼水棉混纺",
      pattern: "纯色",
      fit: "常规",
      silhouette: "直身",
      seasons: ["spring", "autumn"],
      baseFormality: 4.1,
      baseWarmth: 3.2,
      tags: ["commute", "rain-ready", "layered"],
      keywords: ["都市", "轻户外", "防雨"],
      promptShape: "单件女士短风衣，门襟利落，肩部轻挺，面料挺括但有柔和质感。",
      supportedColors: ["stone", "taupe", "camel", "olive"],
      waterproof: true
    },
    {
      slug: "wool-coat",
      name: "羊毛大衣",
      subcategory: "大衣",
      material: "双面羊毛",
      pattern: "纯色",
      fit: "微宽松",
      silhouette: "长直身",
      seasons: ["autumn", "winter"],
      baseFormality: 4.5,
      baseWarmth: 4.5,
      tags: ["office", "winter", "elevated"],
      keywords: ["静奢", "高级", "秋冬"],
      promptShape: "单件女士长款大衣，面料厚实，轮廓挺阔，衣长接近小腿。",
      supportedColors: ["camel", "mocha", "charcoal", "wine"]
    }
  ],
  dress: [
    {
      slug: "wrap-dress",
      name: "裹身连衣裙",
      subcategory: "连衣裙",
      material: "垂感混纺",
      pattern: "纯色",
      fit: "收腰",
      silhouette: "裹身",
      seasons: ["spring", "summer", "autumn"],
      baseFormality: 3.9,
      baseWarmth: 1.7,
      tags: ["date", "gallery", "sleek"],
      keywords: ["法式", "线条感", "约会"],
      promptShape: "单件女士连衣裙，V 领或裹身结构自然，裙摆线条流畅。",
      supportedColors: ["olive", "dusty-rose", "ink", "wine", "forest"]
    },
    {
      slug: "knit-dress",
      name: "针织连衣裙",
      subcategory: "针织裙",
      material: "细羊毛针织",
      pattern: "纯色",
      fit: "修身",
      silhouette: "H 型",
      seasons: ["autumn", "winter", "spring"],
      baseFormality: 3.6,
      baseWarmth: 3.5,
      tags: ["soft", "polished", "layered"],
      keywords: ["温柔", "秋冬", "都市"],
      promptShape: "单件女士针织连衣裙，裙身修长，针织纹理细腻，整体简洁。",
      supportedColors: ["mocha", "camel", "charcoal", "olive"]
    },
    {
      slug: "shirt-dress",
      name: "衬衫裙",
      subcategory: "衬衫裙",
      material: "棉质混纺",
      pattern: "纯色",
      fit: "常规",
      silhouette: "直筒",
      seasons: ["spring", "summer", "autumn"],
      baseFormality: 4,
      baseWarmth: 2.1,
      tags: ["office", "creative", "clean"],
      keywords: ["利落", "简洁", "日常"],
      promptShape: "单件女士衬衫裙，门襟清晰，袖型简洁，裙摆自然垂落。",
      supportedColors: ["ivory", "ink", "sage", "stone"]
    }
  ],
  shoes: [
    {
      slug: "leather-loafer",
      name: "皮革乐福鞋",
      subcategory: "乐福鞋",
      material: "抛光牛皮",
      pattern: "纯色",
      fit: "常规",
      silhouette: "低跟",
      seasons: ["spring", "autumn", "winter"],
      baseFormality: 4.2,
      baseWarmth: 2.2,
      tags: ["office", "commute", "rain-ready"],
      keywords: ["通勤", "利落", "低调"],
      promptShape: "单件女士鞋履，一双乐福鞋并排摆放，鞋面完整可见，皮革反光柔和。",
      supportedColors: ["black", "wine", "mocha", "ivory"],
      heelHeightCm: 2,
      waterproof: true
    },
    {
      slug: "slingback-heel",
      name: "后空高跟鞋",
      subcategory: "高跟鞋",
      material: "细腻皮革",
      pattern: "纯色",
      fit: "常规",
      silhouette: "尖头",
      seasons: ["spring", "summer", "autumn"],
      baseFormality: 4.3,
      baseWarmth: 1.1,
      tags: ["date", "dressy", "polished"],
      keywords: ["轻熟", "优雅", "精致"],
      promptShape: "单件女士鞋履，一双后空高跟鞋并排摆放，鞋型修长，鞋面平整。",
      supportedColors: ["cream", "dusty-rose", "black", "wine"],
      heelHeightCm: 6
    },
    {
      slug: "ankle-boot",
      name: "短靴",
      subcategory: "短靴",
      material: "哑光牛皮",
      pattern: "纯色",
      fit: "常规",
      silhouette: "踝靴",
      seasons: ["autumn", "winter", "spring"],
      baseFormality: 3.9,
      baseWarmth: 3.4,
      tags: ["rain-ready", "city", "layered"],
      keywords: ["秋冬", "酷感", "耐穿"],
      promptShape: "单件女士鞋履，一双踝靴并排摆放，鞋筒挺括，鞋面干净。",
      supportedColors: ["black", "mocha", "charcoal", "olive"],
      heelHeightCm: 4,
      shaftHeight: "ankle",
      waterproof: true
    },
    {
      slug: "minimal-sneaker",
      name: "极简运动鞋",
      subcategory: "运动鞋",
      material: "皮革拼网布",
      pattern: "纯色",
      fit: "常规",
      silhouette: "低帮",
      seasons: ["spring", "summer", "autumn"],
      baseFormality: 2.4,
      baseWarmth: 1.5,
      tags: ["casual", "city", "clean"],
      keywords: ["极简", "通勤休闲", "轻松"],
      promptShape: "单件女士鞋履，一双极简运动鞋并排摆放，轮廓干净，材质拼接克制。",
      supportedColors: ["white", "ivory", "stone", "sage"],
      heelHeightCm: 2
    }
  ],
  accessory: [
    {
      slug: "structured-bag",
      name: "结构感托特包",
      subcategory: "托特包",
      material: "纹理皮革",
      pattern: "纯色",
      fit: "大容量",
      silhouette: "结构感",
      seasons: ["spring", "autumn", "winter"],
      baseFormality: 4,
      baseWarmth: 1.4,
      tags: ["office", "commute", "practical"],
      keywords: ["通勤", "容量", "低调"],
      promptShape: "单件女士包袋，托特包正面展示，包型挺阔，细节克制。",
      supportedColors: ["olive", "camel", "black", "taupe"]
    },
    {
      slug: "shoulder-bag",
      name: "肩背包",
      subcategory: "肩背包",
      material: "细纹皮革",
      pattern: "纯色",
      fit: "中等容量",
      silhouette: "弧形",
      seasons: ["spring", "summer", "autumn", "winter"],
      baseFormality: 3.8,
      baseWarmth: 1.2,
      tags: ["city", "daily", "refined"],
      keywords: ["都市", "利落", "百搭"],
      promptShape: "单件女士包袋，肩背包正面展示，包身简洁，轮廓轻盈。",
      supportedColors: ["black", "mocha", "taupe", "cream"]
    },
    {
      slug: "baguette-bag",
      name: "腋下包",
      subcategory: "腋下包",
      material: "光面皮革",
      pattern: "纯色",
      fit: "小容量",
      silhouette: "细长",
      seasons: ["spring", "summer", "autumn", "winter"],
      baseFormality: 3.7,
      baseWarmth: 1.1,
      tags: ["date", "city", "sleek"],
      keywords: ["精致", "轻熟", "小巧"],
      promptShape: "单件女士包袋，腋下包正面展示，包型细长，五金低调。",
      supportedColors: ["wine", "black", "cream", "ivory"]
    },
    {
      slug: "arc-earring",
      name: "弧形耳饰",
      subcategory: "耳饰",
      material: "金属",
      pattern: "纯色",
      fit: "轻量",
      silhouette: "弧形",
      seasons: ["spring", "summer", "autumn", "winter"],
      baseFormality: 3.9,
      baseWarmth: 1,
      tags: ["polished", "date", "light"],
      keywords: ["首饰", "点睛", "简洁"],
      promptShape: "单件女士首饰，一对耳饰并排摆放，轮廓简洁，金属光泽柔和。",
      supportedColors: ["gold", "silver"]
    },
    {
      slug: "pearl-earring",
      name: "珍珠耳饰",
      subcategory: "耳饰",
      material: "珍珠与金属",
      pattern: "纯色",
      fit: "轻量",
      silhouette: "垂坠",
      seasons: ["spring", "summer", "autumn", "winter"],
      baseFormality: 4,
      baseWarmth: 1,
      tags: ["feminine", "polished", "dressy"],
      keywords: ["珍珠", "柔和", "优雅"],
      promptShape: "单件女士首饰，一对珍珠耳饰并排摆放，结构克制，细节精致。",
      supportedColors: ["pearl", "gold", "silver"]
    },
    {
      slug: "fine-chain-necklace",
      name: "细链项链",
      subcategory: "项链",
      material: "金属",
      pattern: "纯色",
      fit: "贴颈",
      silhouette: "细链",
      seasons: ["spring", "summer", "autumn", "winter"],
      baseFormality: 3.7,
      baseWarmth: 1,
      tags: ["light", "layered", "refined"],
      keywords: ["首饰", "轻盈", "叠戴"],
      promptShape: "单件女士首饰，一条细链项链平铺展示，链条清晰，金属质感干净。",
      supportedColors: ["gold", "silver"]
    },
    {
      slug: "pendant-necklace",
      name: "吊坠项链",
      subcategory: "项链",
      material: "金属",
      pattern: "纯色",
      fit: "中长",
      silhouette: "吊坠",
      seasons: ["spring", "summer", "autumn", "winter"],
      baseFormality: 3.8,
      baseWarmth: 1,
      tags: ["polished", "soft", "detail"],
      keywords: ["吊坠", "点缀", "知性"],
      promptShape: "单件女士首饰，一条吊坠项链平铺展示，吊坠清晰，链身平整。",
      supportedColors: ["gold", "silver"]
    },
    {
      slug: "slim-belt",
      name: "细皮带",
      subcategory: "腰带",
      material: "皮革",
      pattern: "纯色",
      fit: "细版",
      silhouette: "线性",
      seasons: ["spring", "summer", "autumn", "winter"],
      baseFormality: 3.8,
      baseWarmth: 1,
      tags: ["waist", "tailored", "clean"],
      keywords: ["收腰", "通勤", "利落"],
      promptShape: "单件女士配饰，一条细皮带平铺展示，皮面平整，扣头清晰。",
      supportedColors: ["black", "mocha", "camel", "wine"]
    },
    {
      slug: "silk-scarf",
      name: "真丝方巾",
      subcategory: "丝巾",
      material: "真丝",
      pattern: "纯色",
      fit: "小方巾",
      silhouette: "方形",
      seasons: ["spring", "summer", "autumn"],
      baseFormality: 3.6,
      baseWarmth: 1.2,
      tags: ["soft", "fortune-color", "feminine"],
      keywords: ["丝巾", "点亮", "法式"],
      promptShape: "单件女士配饰，一条真丝方巾平铺展示，折角整洁，面料柔亮。",
      supportedColors: ["forest", "sage", "ivory", "wine"]
    }
  ]
};

export function generateWardrobeSeed(options: WardrobeSeedOptions): WardrobeSeedOutput {
  const rng = createSeededRandom(options.seed);
  const items: GeneratedWardrobeItem[] = [];
  const manifest: GeneratedImageManifestEntry[] = [];
  const categoryPlan = buildCategoryPlan(options.count, options.categoryCounts, rng);
  const personaPlan = buildPersonaPlan(categoryPlan, options.personaKeys, rng);
  const templatePlans = buildTemplatePlans(categoryPlan, rng);

  for (let index = 0; index < options.count; index += 1) {
    const category = categoryPlan[index] ?? "top";
    const persona = personaPlan[index] ?? STYLE_PERSONA_PROFILES.business;
    const spec = nextTemplateForCategory(templatePlans, category);
    const color = pick(resolveColors(spec), rng);
    const fileName = `${buildItemID(spec.slug, color.id, index + 1)}.${options.imageExtension}`;
    const relativeImagePath = `generated/images/${fileName}`;
    const imageUrl = joinUrlPath(options.imageBaseUrl, fileName);
    const formality = roundToSingleDecimal(withVariance(spec.baseFormality, rng, 0.35));
    const warmth = roundToSingleDecimal(withVariance(spec.baseWarmth, rng, 0.45));
    const name = `${color.name}${spec.name}`;
    const itemId = fileName.replace(`.${options.imageExtension}`, "");
    const tags = uniqueStrings([
      ...spec.tags,
      ...spec.keywords,
      ...persona.tags,
      persona.name,
      color.id
    ]);
    const prompt = buildImagePrompt(name, spec, color, persona);
    const negativePrompt =
      "不要模特，不要人物，不要手，不要衣架，不要品牌 logo，不要文字，不要水印，不要多件商品，不要复杂背景。";
    const metadata: WardrobeItemMetadata = {
      audience: "women",
      subcategory: spec.subcategory,
      material: spec.material,
      pattern: spec.pattern,
      fit: spec.fit,
      silhouette: spec.silhouette,
      stylePersona: persona.name,
      keywords: uniqueStrings([...spec.keywords, ...persona.tags, persona.name]),
      styleDirection: IMAGE_STYLE_DIRECTION,
      imagePrompt: prompt,
      negativePrompt,
      imagePath: relativeImagePath,
      heelHeightCm: spec.heelHeightCm,
      shaftHeight: spec.shaftHeight,
      waterproof: spec.waterproof
    };

    items.push({
      id: itemId,
      name,
      category,
      colors: buildColorPalette(color, rng),
      seasons: spec.seasons,
      formality,
      warmth,
      tags,
      imageUrl,
      metadata
    });

    manifest.push({
      itemId,
      fileName,
      outputPath: relativeImagePath,
      imageUrl,
      styleDirection: IMAGE_STYLE_DIRECTION,
      prompt,
      negativePrompt,
      renderMode: options.renderMode
    });
  }

  return { items, manifest };
}

export function renderPlaceholderSvg(item: GeneratedWardrobeItem): string {
  const fallbackColor = COLORS[0]!;
  const primaryColor =
    COLORS.find((candidate) => candidate.id === item.colors[0]) ?? fallbackColor;
  const accentColor =
    COLORS.find((candidate) => candidate.id === item.colors[1]) ?? primaryColor;
  const background = "#FFFFFF";
  const shadow = "#EDE7DF";
  const shape = categoryShape(item.category);
  const metadataLine = item.metadata
    ? `${item.metadata.subcategory} / ${item.metadata.material} / ${item.metadata.stylePersona ?? "商务风"}`
    : item.category;
  const styleDirection = item.metadata?.styleDirection ?? IMAGE_STYLE_DIRECTION;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1280" viewBox="0 0 1024 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1280" fill="${background}"/>
  <rect x="96" y="96" width="832" height="832" rx="72" fill="#FCFAF6" stroke="#EEE8DF" stroke-width="4"/>
  <ellipse cx="512" cy="884" rx="244" ry="42" fill="${shadow}"/>
  <g transform="translate(232 180)">
    <path d="${shape}" fill="${primaryColor.hex}" stroke="${accentColor.hex}" stroke-width="18" stroke-linejoin="round"/>
  </g>
  <rect x="140" y="972" width="206" height="52" rx="26" fill="${primaryColor.hex}"/>
  <text x="172" y="1006" fill="${primaryColor.inkHex}" font-size="24" font-family="PingFang SC, Helvetica, Arial, sans-serif">${escapeXml(
    categoryLabel(item.category)
  )}</text>
  <text x="140" y="1090" fill="#1F2023" font-size="46" font-weight="700" font-family="PingFang SC, Helvetica, Arial, sans-serif">${escapeXml(
    item.name
  )}</text>
  <text x="140" y="1144" fill="#5A5D63" font-size="28" font-family="PingFang SC, Helvetica, Arial, sans-serif">${escapeXml(
    metadataLine
  )}</text>
  <text x="140" y="1198" fill="#7C7E84" font-size="24" font-family="PingFang SC, Helvetica, Arial, sans-serif">${escapeXml(
    styleDirection
  )}</text>
</svg>`;
}

function categoryShape(category: ClothingCategory): string {
  switch (category) {
    case "top":
      return "M145 20L240 72L308 32L388 92L340 162L322 406H78L60 162L12 92L92 32L160 72L255 20H145Z";
    case "bottom":
      return "M82 18H318L352 338L286 406L220 258L154 406L48 338L82 18Z";
    case "outerwear":
      return "M130 20L240 70L350 20L412 116L334 192L372 430H248V254H232V430H108L146 192L68 116L130 20Z";
    case "dress":
      return "M170 18H250L284 92L250 166L372 410H48L170 166L136 92L170 18Z";
    case "shoes":
      return "M18 268C44 248 90 236 130 236H246C288 236 334 252 376 282L446 332C474 352 512 366 546 366H566V414H18V268Z";
    case "accessory":
      return "M104 152C104 82 162 24 232 24C302 24 360 82 360 152V186H414V430H50V186H104V152ZM150 152V186H314V152C314 107 277 70 232 70C187 70 150 107 150 152Z";
  }
}

function buildImagePrompt(
  name: string,
  spec: TemplateSpec,
  color: ColorOption,
  persona: StylePersonaProfile
): string {
  return [
    `电商白底写实商品图，一件女款${name}。`,
    spec.promptShape,
    `主色是${color.name}，材质是${spec.material}，版型为${spec.fit}，轮廓是${spec.silhouette}。`,
    `${persona.promptHint}${persona.description}`,
    "单品居中，4:5 竖版构图，纯白背景，柔和棚拍灯光，边缘清晰，材质纹理真实，阴影自然克制。"
  ].join("");
}

function categoryLabel(category: ClothingCategory): string {
  switch (category) {
    case "top":
      return "上装";
    case "bottom":
      return "下装";
    case "outerwear":
      return "外套";
    case "dress":
      return "连衣裙";
    case "shoes":
      return "鞋履";
    case "accessory":
      return "配饰";
  }
}

function buildCategoryPlan(
  count: number,
  counts: Partial<Record<ClothingCategory, number>> | undefined,
  rng: SeededRandom
): ClothingCategory[] {
  const hasExplicitCounts = !!counts && Object.keys(counts).length > 0;
  const categoryCounts = hasExplicitCounts
    ? {
        ...DEFAULT_CATEGORY_COUNTS,
        ...counts
      }
    : allocateByWeights(count, DEFAULT_CATEGORY_COUNTS);
  const plan: ClothingCategory[] = [];
  const total = Object.values(categoryCounts).reduce((sum, value) => sum + value, 0);

  if (total !== count) {
    throw new Error(`分类数量总和必须等于 count。当前总和是 ${total}，count 是 ${count}。`);
  }

  for (const [category, categoryCount] of Object.entries(categoryCounts) as Array<
    [ClothingCategory, number]
  >) {
    for (let index = 0; index < categoryCount; index += 1) {
      plan.push(category);
    }
  }

  return shuffleInPlace(plan, rng);
}

function buildPersonaPlan(
  categoryPlan: ClothingCategory[],
  personaKeys: StylePersonaKey[],
  rng: SeededRandom
): StylePersonaProfile[] {
  const resolvedKeys = personaKeys.length ? uniqueStrings(personaKeys) : (["business"] as StylePersonaKey[]);

  return categoryPlan.map((category, index) => {
    const candidates = resolvedKeys
      .map((key) => STYLE_PERSONA_PROFILES[key])
      .filter(
        (persona): persona is StylePersonaProfile =>
          !!persona &&
          (!persona.preferredCategories || persona.preferredCategories.includes(category))
      );

    if (!candidates.length) {
      return STYLE_PERSONA_PROFILES.business;
    }

    return candidates[(index + Math.floor(rng() * candidates.length)) % candidates.length]!;
  });
}

function buildTemplatePlans(
  categoryPlan: ClothingCategory[],
  rng: SeededRandom
): Record<ClothingCategory, TemplateSpec[]> {
  const counts = categoryPlan.reduce<Record<ClothingCategory, number>>(
    (accumulator, category) => {
      accumulator[category] += 1;
      return accumulator;
    },
    {
      top: 0,
      bottom: 0,
      outerwear: 0,
      dress: 0,
      shoes: 0,
      accessory: 0
    }
  );

  return {
    top: buildCategoryTemplatePlan(TEMPLATE_SPECS.top, counts.top, rng),
    bottom: buildCategoryTemplatePlan(TEMPLATE_SPECS.bottom, counts.bottom, rng),
    outerwear: buildCategoryTemplatePlan(TEMPLATE_SPECS.outerwear, counts.outerwear, rng),
    dress: buildCategoryTemplatePlan(TEMPLATE_SPECS.dress, counts.dress, rng),
    shoes: buildCategoryTemplatePlan(TEMPLATE_SPECS.shoes, counts.shoes, rng),
    accessory: buildCategoryTemplatePlan(TEMPLATE_SPECS.accessory, counts.accessory, rng)
  };
}

function buildCategoryTemplatePlan(
  templates: TemplateSpec[],
  count: number,
  rng: SeededRandom
): TemplateSpec[] {
  const shuffledTemplates = shuffleInPlace(templates, rng);
  const plan: TemplateSpec[] = [];

  for (let index = 0; index < count; index += 1) {
    plan.push(shuffledTemplates[index % shuffledTemplates.length]!);
  }

  return plan;
}

function nextTemplateForCategory(
  plans: Record<ClothingCategory, TemplateSpec[]>,
  category: ClothingCategory
): TemplateSpec {
  return plans[category].shift() ?? TEMPLATE_SPECS[category][0]!;
}

function buildColorPalette(primary: ColorOption, rng: SeededRandom): string[] {
  const palette = [primary.id];
  const alternates = COLORS.filter((candidate) => candidate.id !== primary.id);
  if (rng() > 0.45) {
    palette.push(pick(alternates, rng).id);
  }
  return uniqueStrings(palette);
}

function resolveColors(spec: TemplateSpec): ColorOption[] {
  if (!spec.supportedColors?.length) {
    return COLORS;
  }

  return COLORS.filter((candidate) => spec.supportedColors?.includes(candidate.id));
}

function buildItemID(baseSlug: string, colorID: string, index: number): string {
  return `${baseSlug}-${colorID}-${String(index).padStart(2, "0")}`;
}

function joinUrlPath(base: string, fileName: string): string {
  const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalized}/${fileName}`;
}

function withVariance(base: number, rng: SeededRandom, spread: number): number {
  const delta = (rng() * 2 - 1) * spread;
  return clamp(base + delta, 1, 5);
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function uniqueStrings<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

function allocateByWeights<T extends string>(
  total: number,
  counts: Record<T, number>
): Record<T, number> {
  const entries = Object.entries(counts) as Array<[T, number]>;
  const totalWeight = entries.reduce((sum, [, value]) => sum + value, 0);
  const allocation = Object.fromEntries(entries.map(([key]) => [key, 0])) as Record<T, number>;

  if (totalWeight <= 0) {
    return allocation;
  }

  const raw = entries.map(([key, value]) => {
    const scaled = (value / totalWeight) * total;
    return {
      key,
      floor: Math.floor(scaled),
      remainder: scaled - Math.floor(scaled)
    };
  });

  let assigned = 0;
  for (const item of raw) {
    allocation[item.key] = item.floor;
    assigned += item.floor;
  }

  let remaining = total - assigned;
  raw
    .sort((left, right) => right.remainder - left.remainder)
    .forEach((item) => {
      if (remaining <= 0) return;
      allocation[item.key] += 1;
      remaining -= 1;
    });

  return allocation;
}

function pick<T>(values: T[], rng: SeededRandom): T {
  return values[Math.floor(rng() * values.length)] ?? values[0]!;
}

function shuffleInPlace<T>(values: T[], rng: SeededRandom): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const current = copy[index]!;
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = current;
  }
  return copy;
}

function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let hashed = state;
    hashed = Math.imul(hashed ^ (hashed >>> 15), hashed | 1);
    hashed ^= hashed + Math.imul(hashed ^ (hashed >>> 7), hashed | 61);
    return ((hashed ^ (hashed >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}
