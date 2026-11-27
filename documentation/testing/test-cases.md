# Test Suite Inventory (`test-cases.md`)

Complete inventory of the automated test suites executed by `npm test` across the unified monorepo.

---

## 1. `@charitychain/shared` (`1` File)
* `shared/src/index.test.js`

## 2. `@charitychain/database` (`6` Files)
* `database/tests/schema.test.js` — validates Prisma client generation & model alignment
* `database/tests/constraints.test.js` — verifies PostgreSQL `BEFORE UPDATE OR DELETE` immutability triggers (`case_events_append_only`, `allocations_append_only`, `donation_raw_callbacks_append_only`)
* `database/tests/migrations.test.js` — verifies applied migrations state
* `database/tests/seeds.test.js` — verifies idempotent roles, permissions, university, inventory, and admin seed records
* `database/tests/inventory.test.js` — verifies inventory batches and stock-movement invariants
* `database/tests/ledger.test.js` — verifies financial ledger account/journal/lot data integrity

## 3. `@charitychain/backend` (`46` Files)

### API & Security Suites (`3` Files)
* `backend/tests/api/health.test.js` (`/api/v1/health/live`, `/ready`)
* `backend/tests/api/routes.test.js` (router mounting across public, webhook, Daraja, and authenticated routes)
* `backend/tests/security/middleware.test.js` (rate limits, Helmet headers, CSRF protection, RBAC, auth boundary guards)

### Unit Suites (`23` Files)
`backgroundJobs`, `bankDeposit`, `bankReconciliation`, `bootstrap`, `casesWorkflow`, `configuration`, `constantsAndErrors`, `dailyDigest`, `daraja`, `donorReference`, `evidenceCryptography`, `externalIntegrations`, `forensicAnalytics`, `ipfsAdapter`, `items`, `lotsAndFifo`, `phase2Features` (simulator, DAG, Benford check, claiming, name screening, badges, k-anonymity), `phase3Features` (audit export, testnet stablecoin, Merkle verify, Chainlink automation, SVG certificates), `rolesAndPermissions`, `securityUtilities`, `transactionalOutbox`, `transparency`, `utilities` (`backend/tests/unit/*.test.js`).

### Postgres Integration Suites (`20` Files)
`applications`, `approvals`, `auditLogs`, `authAccess`, `blockchainAudit`, `committee`, `confirmations`, `disbursements`, `donorsRecognition`, `evidence`, `goodsCollections`, `inventory`, `moneyDonations`, `notifications`, `payments`, `physicalDonations`, `prdEntitiesAndTriggers`, `reconciliation`, `universityRecords`, `vetting` (`backend/tests/integration/*.test.js`).

## 4. `@charitychain/frontend` (`22` Files)
* `frontend/src/app/bootstrap.test.jsx`, `frontend/src/app/theme/theme.test.jsx`
* `frontend/src/components/components.test.jsx`
* `frontend/src/features/signing/signing.test.tsx` (EIP-712 `"CharityChain CaseWorkflow"` UI, Demo Signatory & `Web3.js` wallet prompts)
* `frontend/src/features/{assistanceApplications,authentication,authorization,committeeApprovals,disbursements,donorIdentity,goodsCollection,help,inventory,moneyDonations,physicalDonations,recognitionTiers,studentVetting,transparency}/tests/*.test.jsx`
* `frontend/src/layouts/tests/navigation.test.js`, `frontend/src/pages/public/publicPages.test.js`, `frontend/src/services/clientState.test.js`, `frontend/src/utils/sharedUtilities.test.js`

## 5. `@charitychain/blockchain` (`3` Active Unit Suites + Hardhat Invariants)
* **Run by `npm run test -w @charitychain/blockchain`:**
  * `blockchain/test/unit/CharityChainAccess.test.js` (role setup)
  * `blockchain/test/unit/CoreContracts.test.js` (`DonationLedger` deduplication, `PeriodAnchor` daily root & versioned quarterly report, `SignatoryRegistry` tracking, `CaseWorkflow` 2-of-3 EIP-712 release + duplicate-signer rejection, `ChainlinkFxAndAutomation` USD/KES conversion + stale feed revert + daily `checkUpkeep`/`performUpkeep`)
  * `blockchain/test/unit/EvidenceRegistry.test.js` (sequential commitment anchoring & invalid-writer rejection)
* **Additional contract checks:** `blockchain/test/integration/auditFlow.test.js`, `blockchain/test/invariants/noDuplicateCommitment.test.js`, `blockchain/test/invariants/noUnauthorizedWriter.test.js`
