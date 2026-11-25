# Deployment Guide (Docker Compose, Containers & Smart Contracts)

This guide covers full-stack containerized deployment via [docker-compose.yml](../../docker-compose.yml) as well as smart contract deployment to `localhost` or `polygonAmoy`.

---

## 1. Container Stack Build & Launch

CharityChain ships Debian-based Node 22 images (`node:22-bookworm-slim` with `openssl` for Prisma) in `infrastructure/docker/`:
* [backend.Dockerfile](../../infrastructure/docker/backend.Dockerfile) — installs monorepo production deps, generates Prisma client, runs Express 5 API on port `3000`.
* [frontend.Dockerfile](../../infrastructure/docker/frontend.Dockerfile) — builds Vite static bundle (`dist/`) and serves through [nginx.conf](../../infrastructure/nginx/nginx.conf) with [security-headers.conf](../../infrastructure/nginx/security-headers.conf), proxying `/api/v1` to `backend`.
* [simulator.Dockerfile](../../infrastructure/docker/simulator.Dockerfile) — isolated simulator / seeding container (`--profile tools`).

### Deploy Full Stack Locally or on a VM

```bash
cp .env.example .env
# Populate real secrets in .env (SESSION_SECRET, ENCRYPTION_KEY, POSTGRES_PASSWORD, etc.)

docker compose up --build -d
docker compose ps
```

The `bootstrap` service automatically runs `npm run migrate:deploy -w @charitychain/database` and `npm run seed -w @charitychain/database` before `backend` starts. Optionally populate simulated students inside Docker:

```bash
docker compose --profile tools run --rm simulator
```

---

## 2. Smart Contract Deployment (`localhost` / `polygonAmoy`)

```bash
# Compile contracts and export all 7 ABIs into shared/abis/
npm run contracts:compile

# Deploy to local Hardhat node (port 8545)
npx --workspace=@charitychain/blockchain hardhat run scripts/deploy.js --network localhost

# Deploy to Polygon Amoy (requires POLYGON_RPC_URL & funded BLOCKCHAIN_SERVICE_PRIVATE_KEY)
npx --workspace=@charitychain/blockchain hardhat run scripts/deploy.js --network polygonAmoy
```

Deployment outputs save contract addresses to `blockchain/deployments/<network>/addresses.json`. Set `VITE_CASE_WORKFLOW_ADDRESS` and `BLOCKCHAIN_AUDIT_CONTRACT_ADDRESS` to match the deployed manifest before building `frontend` and starting `backend`.

---

## 3. Post-Deploy Smoke Checks

```bash
curl -fsS http://localhost:3000/api/v1/health/live
curl -fsS http://localhost:3000/api/v1/health/ready
curl -fsS http://localhost:3000/api/v1/public/stats
```

Expected: HTTP `200`, `"status": "ready"`, `"dependencies": { "database": "ok" }`.
