# Testing Strategy & Quality Gates

CharityChain verifies correctness across all five workspaces (`shared`, `database`, `backend`, `frontend`, `blockchain`) with zero relaxed assertions and real PostgreSQL integration execution ([PRD §17](../requirements/product-requirements-document.md#17-testing-strategy)).

---

## 1. Automated Verification Pyramid

| Workspace | Tooling | Scope & Execution Model | Latest Verified Suite Count |
| --- | --- | --- | --- |
| **`@charitychain/shared`** | Vitest (`src/index.test.js`) | Shared canonical exports and helper validation | `1` file, `1` test passed |
| **`@charitychain/database`** | Vitest (`tests/*.test.js`) | Schema validity, `BEFORE UPDATE OR DELETE` trigger enforcement, 26 migrations, seeders, inventory & ledger integrity against Postgres (`5435`) | `6` files, `8` tests passed |
| **`@charitychain/backend`** | Vitest + Supertest (`tests/{unit,security,api,integration}`) | Serial execution against real PostgreSQL (`--maxWorkers=1 --testTimeout=30000`) preventing shared-table contention across Daraja, FIFO lots, cases, vetting, forensics, simulator, RBAC, and public privacy leak tests | `46` files, `216` tests passed |
| **`@charitychain/frontend`** | Vitest + Testing Library (`jsdom`, `src/**/*.test.{js,jsx,tsx}`) | Portal navigation, theme parity (`data-theme` / `.dark`), role guards, HTTP/CSRF error mapping, and `Web3.js` EIP-712 `SigningQueuePage` tests (`signing.test.tsx`) | `22` files, `52` tests passed |
| **`@charitychain/blockchain`** | Node test runner + Hardhat Viem (`test/unit/*.test.js`) | Contract access control, write-once `DonationLedger`, sequential `EvidenceRegistry`, versioned `PeriodAnchor`, 2-of-3 EIP-712 `CaseWorkflow`, and `ChainlinkFxAndAutomation` FX/staleness/upkeep | `3` suites, `7` tests passed (`0` failed, `0` skipped) |

---

## 2. Standard Verification Commands

```bash
# 1. Zero-warning ESLint across all workspaces
npm run lint

# 2. Validate Prisma schema (86 models)
npm run db:validate

# 3. Build shared, generate Prisma client, validate backend, typecheck & bundle frontend (tsc + Vite), compile Solidity
npm run build

# 4. Run full 284-test suite across all 5 workspaces
npm test
```

*(Coverage helper: `npm run test:coverage` runs coverage reports for `@charitychain/backend` and `@charitychain/frontend`.)*

---

## 3. Forensic Precision & Recall Evaluation

`backend/src/simulator/fraudSimulator.js` simulates a full 12-month campus charity ledger (`donation`, `bank`, `in-kind`, `cases`, `disbursements`, `badges`) and injects **10 labeled fraud scenarios** (missing evidence, self-approval, threshold structuring, signer collusion, idle lump payouts, phantom beneficiary, pharmacy shrinkage, post-anchor digest tamper, badge reversal gaming, and badge farming) to evaluate R01–R20 detection metrics in automated tests (`phase2Features.test.js`).
