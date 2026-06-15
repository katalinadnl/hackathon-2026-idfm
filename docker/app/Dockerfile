# syntax=docker/dockerfile:1
FROM node:26-alpine AS build

WORKDIR /app

COPY application/package.json application/package-lock.json ./
RUN npm ci

COPY application/ ./
RUN npx expo export --platform web

FROM nginx:alpine

COPY docker/nginx/app.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
