# CharityChain

CharityChain is a transparent donation, student assistance, inventory management, and forensic fund-flow audit platform combining standard fiat/mobile-money rails (M-Pesa Daraja, Paybill, Bank Transfer) with Polygon-compatible Solidity smart contracts, IPFS evidence storage, Chainlink off-chain data/automation hooks, and forensic anomaly detection.

---

## 1. System Architecture

```
                                  [ Users & Clients ]
                                           │
                                           ▼
                      [ React 19 + TypeScript / JSX Frontend ]
                  (9 Role Portals + Web3.js EIP-712 + Sankey/DAG UI)
                                           │
                                           ▼
                               [ Node.js / Express 5 API ]
                         (Better-Auth, CSRF, RBAC, Forensics)
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
      [ PostgreSQL 17 ]              [ IPFS Kubo ]       [ Polygon / Hardhat / Chainlink ]
   (Prisma, FIFO, Triggers)       (Evidence CIDs)       (CaseWorkflow, PeriodAnchor, FX)
```

* **Frontend:** React 19.3, TypeScript + JSX coexistence, React Router 7.18, Vite 8.3, Tailwind CSS v4 (`@layer`), `Web3.js` 4.16, TanStack React Query, Lucide Icons, `Plus Jakarta Sans` & `Inter`
* **Backend API:** Node.js 22.12+, Express 5.3, Better-Auth (with TOTP MFA & sessions), M-Pesa Daraja STK/B2C/B2B + C2B tokenized callbacks, Resend email, FIFO lot allocation, Benford's Law & R01–R20 forensic engine, 1-year fraud simulator
* **Database & ORM:** PostgreSQL 17, Prisma 6.19, PostgreSQL `BEFORE UPDATE OR DELETE` append-only triggers on `case_events`, `allocations`, and `donation_raw_callbacks`
* **Evidence Storage:** IPFS Kubo 0.39 (decentralized receipt & disbursement evidence CIDs)
* **Smart Contracts:** Solidity 0.8.28, Hardhat 3.21, OpenZeppelin 5.4, `Web3.js` / Viem:
  * [`DonationLedger.sol`](blockchain/contracts/DonationLedger.sol) — immutable notary for M-Pesa, bank, and in-kind donation lots
  * [`CaseWorkflow.sol`](blockchain/contracts/CaseWorkflow.sol) — state machine & 2-of-3 EIP-712 signatory release authorization
  * [`SignatoryRegistry.sol`](blockchain/contracts/SignatoryRegistry.sol) — committee multi-sig wallet registry
  * [`PeriodAnchor.sol`](blockchain/contracts/PeriodAnchor.sol) — daily Merkle root & versioned quarterly report notary
  * [`EvidenceRegistry.sol`](blockchain/contracts/EvidenceRegistry.sol) — append-only evidence commitments
  * [`ChainlinkFxAndAutomation.sol`](blockchain/contracts/ChainlinkFxAndAutomation.sol) — Chainlink `AggregatorV3Interface` USD/KES FX feed consumer & `AutomationCompatibleInterface` daily Merkle root upkeep
* **Monorepo:** npm workspaces (`frontend`, `backend`, `database`, `blockchain`, `shared`) + `simulators`

---

## 2. Core Workflows & Deliverables

### A. Monetary Donation, Student Aid & 2-of-3 Multi-Sig Flow
```
[ Donor Contributes (M-Pesa/Bank/Crypto) ] ──► [ FIFO Donation Lot + Receipt Code (MLK-XXXX-XXXX) ]
                                                        │
                                                        ▼
                                       [ Needs Vetting Engine / Sub-group Cases ]
                                                        │
                                                        ▼
                                       [ Committee Approval & Web3.js EIP-712 2-of-3 Signing ]
                                                        │
                                                        ▼
                                       [ Disbursement + IPFS Evidence + Daily Merkle Anchor ]
                                                        │
                                                        ▼
                                       [ Sankey Trace, 5-Col DAG & Forensic Rule Engine (R01-R20) ]
```

### B. Physical Goods Donation & Distribution Flow
```
[ Donor Declares / Drops Goods ] ──► [ Clerk / Pharmacy Intake & Donor SMS Confirmation ]
                                              │
                                              ▼
                                 [ Inventory Supervisor / Batches & SKUs ]
                                              │
                                              ▼
                                 [ Student Pack Request & Collection Handover ]
```

---

## 3. Unified Portals & DApp Routes

1. **Public Portal (`/`)**: Real-time fund flows (`/transparency`), interactive Sankey trace & Merkle proof verifier (`/trace`), 5-column recognition wall (`/wall`, `/recognition`), donation tracker (`/track`), receipt claiming (`/claim`), physical goods catalog (`/goods`), governance & help center (`/help`, `/faq`).
2. **Donor Portal (`/donor`, `/donor/dapp`)**: Donate money via M-Pesa/Bank, declare goods, claim anonymous receipts, earn impact badges, download cryptographic SVG certificates, and configure privacy aliases.
3. **Student Portal (`/student`)**: Access university academic & fee statements, apply for emergency aid, view automated Need-Index vetting explanations, request physical goods, and submit appeals.
4. **Clerk Portal (`/clerk`)**: Physical intake desk, condition inspection, donor confirmations, student collection handovers, and daily reconciliation.
5. **Inventory Supervisor Portal (`/inventory`, `/inventory/pharmacy`)**: SKU tracking, batch management, pharmacy in-kind stock issuance, and variance adjustments.
6. **Committee Portal (`/committee`, `/committee/cases`, `/committee/signing`)**: Aid application queue, conflict-of-interest checks, sub-group cases, and **live `Web3.js` + MetaMask EIP-712 2-of-3 Signatory Release Queue**.
7. **Finance Operator Portal (`/finance`)**: Approved disbursements, payout execution, exceptions, and M-Pesa/Bank statement reconciliation.
8. **Auditor & Forensics Portal (`/auditor`, `/auditor/fund-flow-dag`, `/auditor/forensic-rules`, `/auditor/quarterly-reports`)**: Live 5-column PostgreSQL Fund-Flow DAG, Benford's Law & R01–R20 anomaly rule tuning, blockchain hash audit, and cryptographic quarterly reports.
9. **Super Administrator Portal (`/admin`, `/admin/users`)** & **Standalone DApp Workspace (`/app/*`)**: User/role provisioning across all roles, policy configuration, simulated university records, integration health, and unified governance console.

---

## 4. Quick Start (Local Development)

### 1. Setup & Infrastructure
```bash
cd charitychain
cp .env.example .env
npm ci
docker compose up -d postgres ipfs
```

### 2. Database Migration & Complete Seeding
```bash
npm run db:generate
npm run migrate:deploy -w @charitychain/database
npm run db:seed:all
```

*This provisions:*
* **14 Core & PRD Roles + 55 Granular Permissions**
* **30 Simulated University Students** (`MUST/SIM/2026/001` through `030`)
* **Physical Goods Inventory** (`Sanitary pads`, `Bath soap`, `Toilet tissue`, `Toothpaste`, batches, and policies)
* **Super Administrator Account**: `admin@charitychain.org` / `Admin123456!` (`/auth/login`)
* **Malkia Governance Demo Accounts**: `/login` (Pharmacy Custodian, Committee Member, Executive Signatory, Treasurer)

### 3. Run Development Servers & Smart Contracts
```bash
npm run contracts:compile
npm run dev
```
* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:3000`
* **API Health Check:** `http://localhost:3000/api/v1/health/ready`

---

## 5. Verification & Tests

```bash
npm run lint                  # ESLint across all workspaces (--max-warnings=0)
npm run db:validate           # Validate Prisma schema
npm run contracts:compile     # Compile Solidity 0.8.28 smart contracts
npm run build                 # Build shared, database client, backend, frontend, and contracts
npm test                      # Run all workspace test suites (shared, database, backend, frontend, blockchain)
```

---

## 6. Documentation & Unification Reference

* [`docs/UNIFICATION_LEDGER.md`](docs/UNIFICATION_LEDGER.md) — Complete zero-loss asset checklist unifying `aldo` and `kip`/`main`
* [`docs/fullPRD.md`](docs/fullPRD.md) & [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Product requirements, architecture, and hashing specifications
* [`documentation/setup-and-running.md`](documentation/setup-and-running.md) — Comprehensive setup, seeding, and provisioning guide
* [`documentation/super admin setup.md`](documentation/super%20admin%20setup.md) — Super Administrator oversight and governance controls
* [`documentation/system dashboards.md`](documentation/system%20dashboards.md) — Functional specifications for the 9 dashboards
