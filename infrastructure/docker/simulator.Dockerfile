FROM node:22-bookworm-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY database/package.json database/package.json
COPY blockchain/package.json blockchain/package.json
COPY shared/package.json shared/package.json
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run db:generate

CMD ["npm", "run", "db:seed:university"]
