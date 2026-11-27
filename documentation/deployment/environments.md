# Runtime Environments & Port Allocation

CharityChain defines four logical runtime profiles mirrored in [.env.example](../../.env.example) and [infrastructure/environments](../../infrastructure/environments).

---

## 1. Environment Matrix

| Profile | Frontend Origin | API Endpoint | Database | Blockchain Network | Payment & Messaging Mode |
| --- | --- | --- | --- | --- | --- |
| **Local Dev (Host + Compose Infra)** | `http://localhost:5173` (Vite) | `http://localhost:3000/api/v1` (Node 22) | Docker Postgres `17` on `localhost:5435` | Localhost (`31337`) or Polygon Amoy (`80002`) | `FEATURE_*` flags configurable; auto dev verification tokens when email/SMS disabled. |
| **Automated Test** | `jsdom` (Vitest) | In-process Express app (Supertest) | Isolated schema / Docker Postgres `5435` | Hardhat ephemeral EVM (`31337`) | Deterministic stubs & mock adapters (`NODE_ENV=test`). |
| **Staging** | HTTPS Web Origin | Managed Node/Container Service | Managed Postgres (automated backups) | **Polygon Amoy (`80002`)** | Safaricom Daraja **Sandbox**, Pinata/IPFS, Resend sandbox/verified domain. |
| **Production (Future Live)** | Strict CORS origin | Supervised HTTPS Node/Nginx cluster | Dedicated managed Postgres over TLS | Polygon PoS / Amoy approved manifest | Live Daraja credentials, verified sender domain, `pauser` & incident response active. |

---

## 2. Port Reference (Local & Docker Compose)

| Port | Service | Source |
| --- | --- | --- |
| `5173` | Frontend (`npm run dev` Vite dev server or Docker Nginx container `:80`) | `package.json` / `docker-compose.yml` |
| `3000` | Backend REST API (`Express 5`) | `docker-compose.yml` / `.env.example` |
| `5435` | Host-mapped PostgreSQL `17` (`postgres:5432` inside Docker network) | `docker-compose.yml` |
| `4001` | IPFS Kubo P2P Swarm | `docker-compose.yml` |
| `5001` | IPFS Kubo RPC API (`IPFS_API_URL`) | `docker-compose.yml` |
| `8080` | IPFS Kubo HTTP Gateway (`IPFS_GATEWAY_URL`) | `docker-compose.yml` |
| `8545` | Optional local Hardhat JSON-RPC node (`LOCAL_RPC_URL`) | `blockchain/hardhat.config.js` |

Reference environment templates exist in `infrastructure/environments/{development,test,staging,production}/config.example.env`.
