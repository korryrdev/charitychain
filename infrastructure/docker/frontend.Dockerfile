FROM node:22.12.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY database/package.json database/package.json
COPY blockchain/package.json blockchain/package.json
COPY shared/package.json shared/package.json
RUN npm ci

COPY . .
RUN npm run build -w @charitychain/frontend

FROM nginx:1.27-alpine

COPY infrastructure/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
