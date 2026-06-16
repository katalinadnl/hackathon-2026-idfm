# syntax=docker/dockerfile:1
FROM node:26-alpine

WORKDIR /app

COPY api/package.json api/package-lock.json ./
RUN npm ci

COPY api/ ./

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
