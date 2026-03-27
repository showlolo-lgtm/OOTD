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
- `PORT`: API 端口，默认 `8787`。

## Open the iOS app

1. 在 Xcode 打开 [`ios/OOTD.xcodeproj`](/Users/yulei/Code/ootd/ios/OOTD.xcodeproj)
2. 运行 `OOTD` scheme
3. 如需指向非默认 API 地址，给 app 设置环境变量 `OOTD_API_BASE_URL`

默认客户端会请求 `http://127.0.0.1:8787`。UI tests 会通过 launch argument 自动切到本地 fixture，不依赖后端。
