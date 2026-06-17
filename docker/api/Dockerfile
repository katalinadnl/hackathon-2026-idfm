# syntax=docker/dockerfile:1

# ─── Stage 1 : deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --frozen-lockfile

# ─── Stage 2 : build ──────────────────────────────────────────────────────────
FROM deps AS build
COPY api/ ./
RUN npm run build

# ─── Stage 3 : dev (utilisé par compose.yaml local) ──────────────────────────
FROM deps AS dev
COPY api/ ./
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ─── Stage 4 : production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
RUN npm ci --frozen-lockfile --omit=dev

USER app
EXPOSE 3000
CMD ["node", "dist/main"]