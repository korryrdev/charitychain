# C4 Level 2: Runtime Containers

The unified monorepo runs cleanly either natively via `npm run dev` (with Docker Postgres & IPFS) or as a multi-container stack defined in [docker-compose.yml](../../docker-compose.yml).

```mermaid
flowchart TB
  USER["Browser Client (User / Signatory + MetaMask)"]

  subgraph DockerOrHost[CharityChain Runtime Stack]
    NGINX["Frontend Container / Vite Dev Server<br/>React 19 + Tailwind + Web3.js<br/>Port 5173 (Nginx :80 in container)"]
    API["Backend Container (Node 22 + Express 5)<br/>40 Domain Modules + Outbox Worker<br/>Port 3000 (/api/v1)"]
    PG[("PostgreSQL 17 Alpine<br/>86 Models + Append-Only Triggers<br/>Host Port 5435 -> Container 5432")]
    IPFS[("IPFS Kubo v0.39.0<br/>API :5001, Gateway :8080, Swarm :4001")]
  end

  EXT_CHAIN["EVM RPC Node<br/>Hardhat (:8545 / 31337) or Polygon Amoy (80002)"]
  EXT_MPESA["Safaricom Daraja Sandbox / Production"]
  EXT_MAIL["Resend Email & SMS Gateway"]

  USER -->|HTTP / HTTPS| NGINX
  NGINX -->|Proxies /api/v1| API
  USER -->|Public RPC Read & eth_signTypedData_v4| EXT_CHAIN
  API -->|Prisma TCP| PG
  API -->|HTTP Pin/Cat| IPFS
  API -->|Web3.js Relayer| EXT_CHAIN
  API -->|STK Push / Query / B2C / B2B| EXT_MPESA
  EXT_MPESA -->|HTTPS Webhooks| API
  API -->|HTTPS API| EXT_MAIL
```

---

## Container Inventory

| Container / Process | Package / Image | Runtime Ports | Primary Responsibilities | Detailed Breakdown |
| --- | --- | --- | --- | --- |
| **Web Frontend (`frontend`)** | `@charitychain/frontend` (`infrastructure/docker/frontend.Dockerfile` + `nginx.conf`) | `5173` | Serves 9 role-based `.jsx` portals, `.tsx` Sankey tracer, 5-column DAG explorer, `Web3.js` MetaMask EIP-712 signer, and Nginx API proxy. | [Frontend Breakdown](../engineering/frontend-breakdown.md) |
| **HTTP API & Workers (`backend`)** | `@charitychain/backend` (`infrastructure/docker/backend.Dockerfile`) | `3000` | Hosts `/api/v1` REST API, Better-Auth sessions, CSRF/RBAC middleware, M-Pesa/Bank adapters, FIFO engine, R01–R20 forensics, simulator, and async outbox relay. | [Backend Breakdown](../engineering/backend-breakdown.md) |
| **Database (`postgres`)** | `postgres:17-alpine` (`@charitychain/database`) | `5435` (host) / `5432` | Stores all 86 Prisma models, executes append-only `BEFORE UPDATE OR DELETE` SQL triggers, and runs initial migrations/seeds via `bootstrap`. | [Data Model](../database/data-model.md) |
| **Evidence Store (`ipfs`)** | `ipfs/kubo:v0.39.0` | `4001`, `5001`, `8080` | Content-addressed storage for AES-256-GCM encrypted disbursement/donation evidence CIDs. | [Audit Anchoring](../blockchain/audit-anchoring.md) |
| **Blockchain & Oracles (`blockchain`)** | `@charitychain/blockchain` (Hardhat 3 / Polygon Amoy) | `8545` (local) / Amoy | Executes immutable notarization contracts (`DonationLedger`, `CaseWorkflow`, `PeriodAnchor`, `EvidenceRegistry`, `SignatoryRegistry`, `CharityChainAccess`, `ChainlinkFxAndAutomation`). | [Smart Contracts](../blockchain/contracts.md) |
