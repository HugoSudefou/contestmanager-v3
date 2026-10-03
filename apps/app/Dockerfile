# Built from the repository root: docker compose build web
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/scoring/package.json packages/scoring/
COPY apps/app/package.json apps/app/
COPY apps/api/package.json apps/api/
RUN npm ci --ignore-scripts
COPY packages/scoring packages/scoring
COPY apps/app apps/app
RUN npm run build -w @contest/scoring && npm run build -w app

FROM nginx:alpine
COPY apps/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/app/www /usr/share/nginx/html
