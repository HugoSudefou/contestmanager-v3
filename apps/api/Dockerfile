# Built from the repository root: docker compose build api
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/scoring/package.json packages/scoring/
COPY apps/app/package.json apps/app/
COPY apps/api/package.json apps/api/
RUN npm ci --ignore-scripts
COPY packages/scoring packages/scoring
COPY apps/api apps/api
RUN npm run build -w @contest/scoring \
  && cd apps/api && npx prisma generate && npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
# Apply pending migrations, import the 2019 sheets once, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
