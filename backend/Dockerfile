FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./tsconfig.base.json ./
COPY sim/package.json sim/
COPY backend/package.json backend/


RUN npm ci

COPY ./ ./

RUN npm run build

CMD ["node", "--enable-source-maps", "backend/dist/server.js"]