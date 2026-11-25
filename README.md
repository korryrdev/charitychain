# CharityChain

CharityChain is an enterprise-grade, transparent donation, student assistance, inventory management, and forensic-audit platform for monetary and physical contributions. It pairs standard fiat and mobile money payment rails (M-Pesa, Paybill, Bank Transfer) with an immutable cryptographic audit trail anchored to Polygon-compatible blockchain contracts and IPFS evidence storage.

---

## 1. System Architecture

```
                                  [ Users & Clients ]
                                           │
                                           ▼
                               [ React 19 Frontend ]
                           (Vite, Tailwind, React Router)
                                           │
                                           ▼
                               [ Node.js / Express API ]
                           (Better-Auth, CSRF, RBAC, REST)
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
      [ PostgreSQL 17 ]              [ IPFS Kubo ]            [ Hardhat / Viem ]
    (Prisma ORM, Ledger)          (Decentralized Docs)     (Polygon Anchor Contracts)
```

* **Frontend:** React 19.3, React Router 7.18, Vite 8.3, Tailwind CSS, Lucide Icons
* **Backend API:** Node.js 22.12+, Express 5.3, Better-Auth (with TOTP MFA and sessions)
* **Database & ORM:** PostgreSQL 17, Prisma Client & CLI 6.19
* **Evidence Storage:** IPFS Kubo 0.39 (Decentralized receipt & inspection evidence)
* **Smart Contracts:** Solidity, Hardhat 3.21, OpenZeppelin 5.4, Viem (Immutable audit anchors)
* **Monorepo:** npm workspaces (`frontend`, `backend`, `database`, `blockchain`, `shared`, `simulators`)

---

## 2. Core Workflows

### A. Monetary Donation & Student Aid Flow
```
[ Donor Contributes ] ──► [ Central Fiat Account (M-Pesa/Bank) ]
                                      │
                                      ▼
                         [ Needs Vetting Engine ]
                  (Simulated Academic Records & Need-Index)
                                      │
                                      ▼
                      [ Committee 2-of-3 Quorum Vote ]
                                      │
                                      ▼
                      [ Finance Operator Disbursement ]
                     (Direct to University Fee Account)
                                      │
                                      ▼
                      [ Daily Ledger Reconciliation ]
                                      │
                                      ▼
                      [ Blockchain & IPFS Audit Anchor ]
```

### B. Physical Goods Donation & Distribution Flow
```
[ Donor Declares Goods ] ──► [ Clerk Physical Intake & Inspection ]
                                      │
                                      ▼
                           [ Donor SMS/Web Confirms ]
                                      │
                                      ▼
                       [ Inventory Supervisor Stocks ]
                    (Categories, Batches, SKU Tracking)
                                      │
                                      ▼
                      [ Student Requests Goods Pack ]
                      (Cooldowns & Category Caps Check)
                                      │
                                      ▼
                       [ Student Confirms Collection ]
                                      │
                                      ▼
                         [ Stock Balance Deducted ]
```

---

## 3. The 9 Role-Based Dashboards & Portals

CharityChain enforces strict **Role-Based Access Control (RBAC)** across 9 integrated user portals:

1. **Public Portal (`/`)**: Real-time fund flows, anonymous donor recognition wall, donation tracker, physical goods catalog, governance & transparency policies.
2. **Donor Portal (`/donor`)**: Donate money, declare goods, view tax receipts, review donation allocations, and configure public aliases.
3. **Student Portal (`/student`)**: Access university academic & fee statements, apply for emergency student aid, track vetting progress, request physical goods, and lodge appeals.
4. **Clerk Portal (`/clerk`)**: Receive goods at physical intake desks, record weight/condition, inspect items, log student collection handovers, and run daily intake reconciliations.
5. **Inventory Supervisor Portal (`/inventory`)**: Warehouse overview, SKU tracking, batch management, storage locations, inspection logs, and low-stock alerts.
6. **Committee Portal (`/committee`)**: Student aid application queue, automated need-index scoring, 2-out-of-3 quorum voting, and funding commitment management.
7. **Finance Operator Portal (`/finance`)**: Approved disbursement queue, execution of fee payments, payment exceptions, and daily bank/M-Pesa reconciliation.
8. **Auditor Portal (`/auditor`)**: Searchable forensic audit logs, anomaly detection, money & goods audit trails, and blockchain hash verification.
9. **Super Administrator Portal (`/admin`)**: Overall platform health, policy management, simulated university database management, and **full user & role management (`/admin/users`) to provision all other dashboards**.

---

## 4. Quick Start (Local Development)

### 1. Prerequisites
* Node.js 22.12.0+ & npm 10+
* Docker Desktop & Docker Compose v2

### 2. Setup & Infrastructure
```powershell
# Clone and enter directory
cd charitychain

# Copy environment configuration
Copy-Item .env.example .env

# Install dependencies across all workspaces
npm ci

# Start PostgreSQL and IPFS services
docker compose up -d postgres ipfs
```

### 3. Database Migration & Complete Seeding
```powershell
# Generate Prisma Client & apply migrations
npm run db:generate
npm run migrate:deploy -w @charitychain/database

# Run complete seed suite (Roles, Permissions, 30 Simulated Students, Inventory & Super Admin)
npm run db:seed:all
```

*This provisions:*
* **8 Core Roles & 39 Granular Permissions**
* **30 Simulated University Students** (`MUST/SIM/2026/001` through `030`) with fee balances and HELB loans
* **Physical Goods Inventory** (Sanitary pads, soap, toothpaste, tissue, batches, and policies)
* **Super Administrator Account**:
  * **Email:** `admin@charitychain.org`
  * **Password:** `Admin12345!`
  * **Login:** `http://localhost:5173/auth/login`

### 4. Run Development Servers
```powershell
npm run dev
```
* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:3000`
* **API Health Check:** `http://localhost:3000/api/v1/health/ready`

---

## 5. Verification & Tests

```powershell
npm run lint                  # Run ESLint
npm run db:validate           # Validate Prisma schema
npm run contracts:compile     # Compile Solidity smart contracts
npm test                      # Run all workspace test suites
npm run verify                # Full CI verification pipeline
```

---

## 6. Detailed Documentation

Detailed architectural specifications, API guides, and runbooks are available in the [`documentation/`](documentation/) directory:

* [`documentation/setup-and-running.md`](documentation/setup-and-running.md) — Comprehensive setup, seeding, and provisioning guide.
* [`documentation/super admin setup.md`](documentation/super admin setup.md) — Super Administrator oversight, governance, and security controls.
* [`documentation/assignable permissions.md`](documentation/assignable%20permissions.md) — The 39 granular permission catalog.
* [`documentation/system dashboards.md`](documentation/system%20dashboards.md) — Functional specifications for all 9 dashboards.
* [`documentation/backend breakdown.md`](documentation/backend%20breakdown.md) — Backend architecture, module contracts, and middleware.
* [`documentation/frontend breakdown.md`](documentation/frontend%20breakdown.md) — Frontend component hierarchy, state, and routes.
