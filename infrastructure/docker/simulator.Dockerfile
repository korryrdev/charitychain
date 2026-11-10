FROM node:22.12.0-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY database/package.json database/package.json
COPY blockchain/package.json blockchain/package.json
COPY shared/package.json shared/package.json
RUN npm ci

COPY . .
RUN npm run db:generate

CMD ["npm", "run", "db:seed:university"]
