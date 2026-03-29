FROM node:22-bookworm-slim

RUN corepack enable

WORKDIR /app

COPY api/package.json api/pnpm-lock.yaml ./api/

WORKDIR /app/api
RUN pnpm install --frozen-lockfile

WORKDIR /app
COPY api ./api
COPY data ./data

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

WORKDIR /app/api
CMD ["pnpm", "start"]
