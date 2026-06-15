# syntax=docker/dockerfile:1
FROM node:26-alpine

WORKDIR /app

COPY application/package.json application/package-lock.json ./
RUN npm ci

EXPOSE 8081
CMD ["npm", "run", "web"]
