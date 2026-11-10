FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./tsconfig.base.json ./
COPY sim/package.json sim/
COPY frontend/package.json frontend/

RUN npm ci

COPY ./ ./

# Vite inlines the API URL at build time, so the image is built per environment
ARG VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL build arg is required" && exit 1)
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w @arena/frontend

FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
