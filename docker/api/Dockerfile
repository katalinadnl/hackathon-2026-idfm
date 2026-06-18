# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --frozen-lockfile

FROM deps AS build
COPY api/ ./
RUN npm run prisma:generate && npm run build

FROM deps AS dev
COPY api/ ./
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
RUN npm ci --frozen-lockfile --omit=dev

USER app
EXPOSE 3000
CMD ["node", "dist/src/main"]