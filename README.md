# CharityChain

CharityChain is a transparent donation, assistance, inventory, and forensic-audit platform for monetary and physical contributions.

## Foundation stack

- React and Vite frontend
- Node.js and Express API
- PostgreSQL and Prisma
- Solidity, Hardhat, Web3.js, and Polygon-compatible contracts
- IPFS local service
- npm workspaces

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- Docker Desktop with Docker Compose

## Local setup

1. Copy `.env.example` to `.env` and replace development-only values where required.
2. Run `npm install`.
3. Run `docker compose up -d postgres ipfs`.
4. Run `npm run db:generate` and `npm run db:migrate`.
5. Run `npm run dev`.

Frontend: `http://localhost:5173`

API liveness: `http://localhost:3000/api/v1/health/live`

## Verification

Run `npm run verify` to lint, check formatting, validate Prisma, build every workspace, compile contracts, and execute the complete foundation test suite.

See `documentation/system dashboards.md` and `documentation/project structure.md` for the approved plans.
