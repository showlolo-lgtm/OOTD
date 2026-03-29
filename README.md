# OOTD Demo

`ootd` 是一个 SwiftUI iPhone Demo，加一个 TypeScript + Fastify 后端。

## Structure

- `api/`: Fastify API, provider abstraction, AI + fallback recommendation pipeline.
- `data/`: fake wardrobe 和人工维护的穿搭灵感库 JSON。
- `ios/`: 原生 SwiftUI iOS app。

## Run the API

```bash
cd /Users/yulei/Code/ootd/api
pnpm install
pnpm start
```

Optional env:

- `OPENAI_API_KEY`: 启用真实 AI 穿搭生成；未配置时自动走 deterministic fallback。
- `OPENAI_MODEL`: 可选，默认 `gpt-4.1-mini`。
- `OPENAI_IMAGE_MODEL`: 可选，真人效果图默认 `gpt-image-1.5`。
- `PORT`: API 端口，默认 `8787`。
- `WARDROBE_DATA_FILE`: 可选，默认 `wardrobe.json`。如需切到批量生成衣柜，设为 `generated/wardrobe.generated.json`。
- `INSPIRATIONS_DATA_FILE`: 可选，默认 `inspirations.json`。
- `OOTD_MODEL_REFERENCE_IMAGE_PATH`: 可选，真人参考图绝对路径。不填时会自动读取 `data/reference/model-reference.jpg`。

## 真人效果图

首页的人物穿搭图现在走固定参考图链路：

1. 后端先拿到 3 套穿搭
2. 再按卡片逐张调用 OpenAI 生成真人效果图
3. 每套默认只生成 `1` 张，避免首屏超时

默认参考图位置：

- `data/reference/model-reference.jpg`

也支持：

- `data/reference/model-reference.jpeg`
- `data/reference/model-reference.png`
- `data/reference/reference.jpg`
- `data/reference/reference.jpeg`
- `data/reference/reference.png`

本地启动一个完整链路的例子：

```bash
cd /Users/yulei/Code/ootd/api
OPENAI_API_KEY=sk-... pnpm start
```

如果你不想把参考图放进仓库，可以显式指定：

```bash
cd /Users/yulei/Code/ootd/api
OPENAI_API_KEY=sk-... \
OOTD_MODEL_REFERENCE_IMAGE_PATH=/绝对路径/你的真人图.jpg \
pnpm start
```

## Generate Wardrobe Seeds

批量生成器在 `api/` 目录下，默认会输出：

- `data/generated/wardrobe.generated.json`: 直接可给 API 使用的衣柜数据
- `data/generated/image-manifest.generated.json`: 同批次图片 prompt 清单
- `data/generated/images/*`: 图片文件

先生成 metadata + 本地占位图：

```bash
cd /Users/yulei/Code/ootd/api
pnpm generate:wardrobe --count 30 --seed 20260328
```

这条命令不需要任何 API key，适合先批量扩充衣柜数据。当前默认会按更实用的衣柜比例分配类别；以 `60` 件为例，大致会生成：

- `14` 件上装
- `12` 件下装
- `10` 双鞋
- `8` 件外套
- `6` 条连衣裙
- `10` 件配饰

生成的 `metadata` 会附带：

- `subcategory`
- `material`
- `pattern`
- `fit`
- `silhouette`
- `keywords`
- `imagePrompt`
- `negativePrompt`
- `imagePath`

如果你要生成真实商品图，再切到 `openai` 模式。当前脚本默认图片模型就是 `gpt-image-1.5`：

```bash
cd /Users/yulei/Code/ootd/api
OPENAI_API_KEY=sk-... pnpm generate:wardrobe --mode openai --seed 20260328 --category-counts top=14,bottom=12,shoes=10,outerwear=8,dress=6,accessory=10 --personas 商务风,学院风,知性风,极简风,法式风,都市风 --quality medium --size 1024x1536
```

说明：

- `placeholder` 模式输出的是本地 `svg` 占位图，适合先做数据和 prompt。
- `openai` 模式会把图片写成 `png`，当前 app 会优先显示这类生成图。
- 图片视觉风格固定是 `电商白底写实风`。
- `--personas` 控制的是服装风格人格，比如 `商务风`、`学院风`、`知性风`、`极简风`、`法式风`、`都市风`。
- `--category-counts` 可以精确指定每个品类数量。
- 可以额外传 `--quality low|medium|high` 和 `--size 1024x1024|1024x1536|1536x1024`。
- 如需保持同一批衣服不变，只改图片风格，继续复用同一个 `--seed`。

让 API 使用生成后的衣柜：

```bash
cd /Users/yulei/Code/ootd/api
WARDROBE_DATA_FILE=generated/wardrobe.generated.json pnpm start
```

API 会自动把生成图通过 `/generated-assets/*` 暴露出来。

## Deploy to Railway

这个仓库现在最省心的公网 demo 方式是直接把整个仓库用 Docker 部署到 Railway。根目录已经带了 [Dockerfile](/Users/yulei/Code/ootd/Dockerfile)，会把 `api/` 和 `data/` 一起打进镜像，所以 `data/generated` 里的图片和 JSON 都会跟着上线。

建议流程：

1. 先在本地把图片都生成完
```bash
cd /Users/yulei/Code/ootd/api
OPENAI_API_KEY=sk-... pnpm generate:wardrobe --mode openai --seed 20260328 --category-counts top=14,bottom=12,shoes=10,outerwear=8,dress=6,accessory=10 --personas 商务风,学院风,知性风,极简风,法式风,都市风 --quality medium --size 1024x1536
```

2. 把这些产物提交到 GitHub
- `data/generated/wardrobe.generated.json`
- `data/generated/image-manifest.generated.json`
- `data/generated/images/*.png`

3. 在 Railway 新建 Project，选择 `Deploy from GitHub repo`

4. Railway 会自动发现根目录的 `Dockerfile`

5. 在 Railway 的 Variables 里设置：
```text
WARDROBE_DATA_FILE=generated/wardrobe.generated.json
OPENAI_API_KEY=sk-...
```

如果你不把参考图提交进仓库，才需要额外设置：

```text
OOTD_MODEL_REFERENCE_IMAGE_PATH=/app/data/reference/model-reference.jpg
```

6. 部署完成后，打开 Railway 分配给你的公网 URL
- `/` 应该返回 `{"ok":true,"service":"ootd-api"}`
- `/health` 应该返回 `{"ok":true}`
- `/v1/wardrobe` 应该返回你生成后的衣柜 JSON

重要说明：

- `OPENAI_API_KEY` 应该只放在 Railway Variables，不要写进代码或提交到 Git。
- 如果你把 `data/reference/model-reference.jpg` 提交进仓库，Railway redeploy 后会自动拿到这张参考图。
- 如果后面你又重新生成了一批衣柜图片，或替换了参考图，需要重新提交对应文件并触发 Railway redeploy。

## Open the iOS app

1. 在 Xcode 打开 [`ios/OOTD.xcodeproj`](/Users/yulei/Code/ootd/ios/OOTD.xcodeproj)
2. 运行 `OOTD` scheme
3. 如需指向非默认 API 地址，给 app 设置环境变量 `OOTD_API_BASE_URL`

默认客户端会请求 `http://127.0.0.1:8787`。UI tests 会通过 launch argument 自动切到本地 fixture，不依赖后端。

补充：

- app build 时会自动把 `data/generated/images/*` 打包进资源。
- 如果存在 `data/reference/model-reference.jpg`，也会一起打进 app bundle。
