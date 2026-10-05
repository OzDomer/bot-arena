FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./tsconfig.base.json ./
COPY sim/package.json sim/
COPY backend/package.json backend/


RUN npm ci

COPY ./ ./

RUN npm run build -w @arena/sim -w @arena/backend

FROM node:24-alpine
ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
COPY sim/package.json sim/
COPY backend/package.json backend/

RUN npm ci --omit=dev -w @arena/sim && npm ci -w @arena/backend

COPY backend/drizzle backend/drizzle
COPY --from=build /app/sim/dist sim/dist
COPY --from=build /app/backend/dist backend/dist

USER node

CMD ["node", "--enable-source-maps", "backend/dist/server.js"]
