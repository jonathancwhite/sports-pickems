# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/email/package.json ./packages/email/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm turbo build --filter=@callsheet/api --filter=@callsheet/worker --filter=@callsheet/db --filter=@callsheet/shared --filter=@callsheet/email

FROM node:22-alpine AS api
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]

FROM node:22-alpine AS worker
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
CMD ["node", "apps/worker/dist/index.js"]
