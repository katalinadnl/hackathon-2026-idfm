# syntax=docker/dockerfile:1

# ─── Stage 1 : deps ───────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY application/package.json application/package-lock.json ./
RUN npm ci --frozen-lockfile

# ─── Stage 2 : build ──────────────────────────────────────────────────────────
FROM deps AS build
ARG EXPO_PUBLIC_API_URL
COPY application/ ./
RUN EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL npm run build:web

# ─── Stage 3 : dev (utilisé par compose.yaml local) ──────────────────────────
FROM deps AS dev
COPY application/ ./
EXPOSE 8081
CMD ["npm", "run", "web"]

# ─── Stage 4 : production — sert le static via nginx ─────────────────────────
FROM nginx:stable-alpine AS production

RUN addgroup -S app && adduser -S app -G app

COPY docker/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]