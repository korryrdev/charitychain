# CharityChain: Setup and Running Guide

This guide describes how to run CharityChain from a fresh clone. It covers the full local stack, the source-code development workflow, Prisma migrations, PostgreSQL, IPFS, and the simulated university student records.

## What runs in the project

| Component | Technology | Local endpoint |
| --- | --- | --- |
| Web application | React 19.3, React Router 7.18, Vite 8.3 | `http://localhost:5173` |
| API | Node.js 22.12+, Express 5.3 | `http://localhost:3000` |
| Database | PostgreSQL 17 | host port `5433` |
| ORM and migrations | Prisma Client and Prisma CLI 6.19 | database workspace |
| Evidence storage | IPFS Kubo 0.39 | API `http://localhost:5001`, gateway `http://localhost:8080` |
| Smart contracts | Solidity, Hardhat 3.21, OpenZeppelin 5.4, Web3.js 4.16 | `blockchain/` |

The repository is an npm-workspace monorepo containing `frontend`, `backend`, `database`, `blockchain`, `shared`, simulations, infrastructure, and documentation.

## Prerequisites

- Git 2.x.
- Node.js **22.12.0 or newer** (the required version is recorded in `.nvmrc`).
- npm 10 or newer, supplied with supported Node.js releases.
- Docker Desktop with Docker Engine and Docker Compose v2 enabled.
- Ports `5173`, `3000`, `5433`, `4001`, `5001`, and `8080` available when using Docker.

Verify the installed tooling:

```powershell
node --version
npm --version
docker --version
docker compose version
```

## Environment configuration

Never commit a real `.env` file. Start from the versioned template:

```powershell
Copy-Item .env.example .env
```

For local development, set `POSTGRES_PASSWORD`, `SESSION_SECRET`, and `ENCRYPTION_KEY` to private values. Keep external payment and SMS feature flags disabled unless valid sandbox credentials are configured. The defaults use normal fiat integrations (M-Pesa, Paybill/bank, and SMS); no cryptocurrency wallet is required for users.

`DATABASE_URL` is different depending on where the API runs:

- Local Node.js process: use `localhost:5433`.
- Docker API container: Compose overrides it to `postgres:5432` automatically.

Use either the Docker workflow or the local-development workflow below; do not run both frontend/API modes on the same ports at the same time.

## Recommended: full Docker stack

From the repository root:

```powershell
docker compose up --build -d
docker compose ps
```

Compose builds and runs these services:

- `postgres`: PostgreSQL 17 with a persistent named volume.
- `ipfs`: local Kubo node with a persistent named volume.
- `bootstrap`: one-time Prisma migration and core role/permission/recognition seed.
- `backend`: the Express API, available on port `3000`.
- `frontend`: Nginx serving the production React build, available on port `5173`.

Wait until `backend`, `postgres`, and `ipfs` are healthy. Then open:

- Application: `http://localhost:5173`
- API readiness: `http://localhost:3000/api/v1/health/ready`
- IPFS gateway: `http://localhost:8080`

View logs when diagnosing startup:

```powershell
docker compose logs --follow bootstrap backend frontend
```

Stop services without deleting data:

```powershell
docker compose down
```

Do not use `docker compose down --volumes` unless you intentionally want to remove the local PostgreSQL and IPFS data.

## Simulated university records

The application uses simulated university data locally. It contains deterministic student records, semesters, fee balances, micro-payment patterns, HELB/scholarship records, and finance-block scenarios used by the vetting engine.

After the Docker stack is healthy, seed or refresh 30 simulated students with:

```powershell
docker compose --profile tools run --rm simulator
```

To choose a count from 6 to 500:

```powershell
docker compose --profile tools run --rm -e SIMULATED_STUDENT_COUNT=60 simulator
```

The simulator updates its known data set and should be run only in local/demo environments. It is not a connection to a real university system.

## Local source-code development

Use this mode when editing React or Node.js code.

1. Install the pinned dependency tree:

   ```powershell
   npm ci
   ```

2. Start infrastructure only:

   ```powershell
   docker compose up -d postgres ipfs
   ```

3. Generate Prisma Client, apply migrations, and seed required roles and permissions:

   ```powershell
   npm run db:generate
   npm run migrate:deploy -w @charitychain/database
   npm run db:seed
   ```

4. Seed the simulated university records:

   ```powershell
   npm run db:seed:university
   ```

5. Start both source services:

   ```powershell
   npm run dev
   ```

The frontend runs at `http://127.0.0.1:5173` in development and proxies `/api` to the API at port `3000`. Start individual services when needed:

```powershell
npm run dev -w @charitychain/backend
npm run dev -w @charitychain/frontend
```

## Database operations

Prisma schema: `database/prisma/schema.prisma`.

| Task | Command |
| --- | --- |
| Generate Prisma Client | `npm run db:generate` |
| Validate Prisma schema | `npm run db:validate` |
| Create a new local migration during schema development | `npm run db:migrate` |
| Apply committed migrations in a deployment | `npm run migrate:deploy -w @charitychain/database` |
| Seed roles, permissions, and recognition tiers | `npm run db:seed` |
| Seed simulated university records | `npm run db:seed:university` |
| Check migration state | `npx prisma migrate status --schema database/prisma/schema.prisma` |

Fresh databases must receive both migrations and the core seed before accounts can be created because registration assigns the `DONOR` role. Student-support workflows also need the simulated university-record seed.

## Authentication in local development

The local environment does not use a real email/SMS delivery provider. A development registration is verified and signed in automatically so the donor dashboard can be tested. Production does not expose verification tokens: it requires a configured delivery provider and the normal verification process.

Accounts can hold both donor and verified student capability in one identity. Student linkage is based on a registration number matched to the local simulated university record; it does not create a second account.

## Verification and tests

Run focused checks while developing:

```powershell
npm run lint
npm run db:validate
npm run build
npm test
npm run contracts:compile
```

Run the full verification suite:

```powershell
npm run verify
```

For Docker readiness:

```powershell
docker compose ps
curl http://localhost:3000/api/v1/health/ready
```

In PowerShell, use this alternative if `curl` resolves differently on the machine:

```powershell
Invoke-WebRequest http://localhost:3000/api/v1/health/ready
```

## Troubleshooting

### Port already in use

Stop the local dev server or the matching Docker service before starting the alternative workflow. Check listeners with:

```powershell
netstat -ano | Select-String ':5173|:3000|:5433'
```

### Prisma cannot authenticate or connect

Confirm `docker compose ps` shows PostgreSQL healthy, confirm `DATABASE_URL` has the matching password and port, then run `npm run migrate:deploy -w @charitychain/database` again. Local processes use port `5433`; containers use `postgres:5432`.

### Registration cannot create an account

Apply migrations and seed core data: `npm run migrate:deploy -w @charitychain/database; npm run db:seed`. The `DONOR` role must exist before account provisioning can complete.

### Frontend shows an API or CSRF error

Use exactly one host consistently (`http://localhost:5173` for Docker or `http://127.0.0.1:5173` for Vite development), refresh once after an API restart, and check the API readiness endpoint. The development configuration explicitly supports both local hosts.

## Production note

This Compose file is for reproducible local/demo use. Before deployment, use managed secrets, HTTPS, a production database backup plan, real provider credentials, a hosted IPFS strategy, strict allowed origins, and an external process supervisor or container platform. Do not expose local Docker ports or development secrets to the public internet.
