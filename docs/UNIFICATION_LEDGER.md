# CharityChain Zero-Loss Unification Ledger

- **Integration Branch:** `feat/unified-charitychain`
- **Source Branch A (`aldo`):** `ce749a2` (Malkia PRD `docs/fullPRD.md`, Solidity Smart Contracts, PostgreSQL triggers, FIFO lots, Forensics & Fraud Simulator, TypeScript `.tsx` DApp)
- **Source Branch B (`kip` / `main`):** `a46cfda` (9 Role-Based Portals, `Plus Jakarta Sans` & `Inter` Design System, M-Pesa Result Codes & STK/B2C/B2B, Resend Email, Student Appeals & MUST Verification, Super Admin Provisioning, Debian Dockerfiles, `db:seed:all`)

Both `aldo`, `kip`, and `main` remain untouched while all assets are combined and verified here.

---

## 1. Payments, Intake & Notifications
- [x] **M-Pesa Daraja Result Codes & Status Query (`kip`)**: `backend/src/integrations/mpesa/mpesaResultCodes.js`, `stkPushQuery.adapter.js`, `mpesa.routes.js`, `b2b.adapter.js`, `b2c.adapter.js`, `callback.validation.js`, `mpesa.client.js`, `mpesa.config.js`, `mpesa.mapper.js`, `transactionStatus.adapter.js`
- [x] **Resend Email Service (`kip`)**: `backend/src/modules/notifications/resendEmail.service.js`
- [x] **Daraja C2B Tokenized Intake & Receipt Codes (`aldo`)**: `backend/src/modules/daraja/*`, `backend/src/utils/receiptCode.js` (`MLK-XXXX-XXXX`)
- [x] **Bank Deposit Maker-Checker & CSV Reconciliation (`aldo`)**: `backend/src/modules/bank/*`
- [x] **In-Kind Item Intake & Issuance (`aldo`)**: `backend/src/modules/items/*`
- [x] **Testnet Stablecoin Channel (`aldo`)**: `backend/src/modules/crypto/*`
- [x] **Money Donations & Receipt Metadata (`kip` + `aldo`)**: `backend/src/modules/moneyDonations/*`, `backend/src/modules/payments/*`

## 2. Backend Auth, RBAC, Student Workflows & Forensics
- [x] **Authentication & Student Email Regex (`kip` + `aldo`)**: `backend/src/modules/auth/*` (donor registration/login, student MUST registration, verification, password recovery, MFA, demo session support)
- [x] **Middleware Compatibility (`kip` + `aldo`)**: `authenticate.js` (Bearer + Better-Auth signed cookie), `csrfProtection.js` (automatic CSRF cookie reissue + webhook/public exemptions), `validateRequest.js` (Express 5 `req.query` property descriptor fix)
- [x] **Super Admin Staff Provisioning & Role Management (`kip` + `aldo`)**: `backend/src/modules/users/*` (`createStaffAccount`, `createUser`, `updateRoles`, `deleteManagedAccount`, `closeOwnAccount`), `backend/src/modules/roles/*` (`roles.controller.js`)
- [x] **Student Appeals & University Records (`kip`)**: `backend/src/modules/complaints/appeals.service.js`, `backend/src/modules/students/*`, `backend/src/modules/universityRecords/*` (`applications.controller.js` auto-vetting on HTTP submit)
- [x] **Malkia Case State Machine, Incremental + Batch 2-of-3 Signatory & FIFO Lots (`aldo` + Web3.js upgrade)**: `backend/src/modules/cases/*` (`GET /cases/subgroups`, incremental & batch `/cases/:id/authorize`), `backend/src/modules/lots/*`
- [x] **Forensic Alerts, Benford's Law, 5-Col DAG & Fraud Simulator (`aldo`)**: `backend/src/modules/alerts/*`, `backend/src/simulator/fraudSimulator.js`, `backend/src/modules/auditLogs/dailyDigest.service.js`
- [x] **Donor Claiming, Moderation, Badges & SVG Certificates (`aldo`)**: `backend/src/modules/donors/donorPortal.*`, `donorClaim.service.js`, `badges.service.js`, `recognitionWall.service.js`, `backend/src/security/donorReference.js`, `nameScreening.js`
- [x] **Cryptographic Quarterly Reports & Merkle Proof Verification (`aldo`)**: `backend/src/modules/reports/*`, `backend/src/modules/public/*`, `backend/src/utils/merkle.js`, `money.js`, `canonicalJson.js`, `assertions.js`, `dates.js`, `pagination.js`, `retry.js`
- [x] **Unified Route Registry (`kip` + `aldo`)**: `backend/src/routes/index.js`

## 3. Database Schema, Triggers & Seeders (`database/`)
- [x] **Unified Prisma Schema**: `database/prisma/schema.prisma` (all `aldo` PRD models + `kip` `StudentAppeal` model)
- [x] **Immutability Triggers (`aldo`)**: `database/prisma/migrations/20261110230000_prd_entities_and_triggers/migration.sql`
- [x] **Student Appeals Migration (`kip`)**: `database/prisma/migrations/20261111010000_student_appeals/migration.sql`
- [x] **Prisma Wrapper & Complete Seed Suite (`kip` + `aldo`)**: `database/package.json`, `database/scripts/prisma.js`, `database/prisma/seed.js` (14 roles & 55 permissions + Malkia demo sessions), `seedUniversityRecords.js`, `seedInventory.js`, `seedAdmin.js`, `db:seed:all`, and complete `database/tests/*.test.js`

## 4. Smart Contracts, Polygon Amoy & On-Chain Chainlink (`blockchain/`)
- [x] **Core Malkia Audit & Governance Contracts (`aldo`)**: `DonationLedger.sol`, `CaseWorkflow.sol` (EIP-712 2-of-3 release), `PeriodAnchor.sol`, `SignatoryRegistry.sol`, `EvidenceRegistry.sol`, `CharityChainAccess.sol`, `HashLib.sol`, `Errors.sol`
- [x] **On-Chain Chainlink FX Feed & Automation Upkeep**: `blockchain/contracts/ChainlinkFxAndAutomation.sol` (+ `IChainlinkAggregatorV3.sol`, `IAutomationCompatible.sol`, `MockChainlinkAggregator.sol`)
- [x] **Polygon Amoy & Localhost Hardhat Setup + ABI Export**: `blockchain/hardhat.config.js`, `blockchain/scripts/deploy.js`, `blockchain/scripts/exportAbis.js`, `shared/abis/*`
- [x] **Contract Unit Tests**: `blockchain/test/unit/CoreContracts.test.js`, `CharityChainAccess.test.js`, `EvidenceRegistry.test.js`

## 5. Unified Frontend (`frontend/`)
- [x] **Unified Build, TypeScript & Vite Setup**: `frontend/package.json`, `frontend/tsconfig.json` (`allowJs: true`, `@/*`), `frontend/vite.config.ts` (`@tailwindcss/vite`, Vitest `jsdom`), `frontend/index.html`, `frontend/src/main.tsx`
- [x] **Dual Theme & Cascade-Safe Styles (`kip` + `aldo`)**: `ThemeContext.tsx` + `ThemeContext.jsx` syncing `data-theme` and `.dark`; `index.css` using Tailwind CSS `@layer` without Preflight override; `@fontsource/plus-jakarta-sans` + `@fontsource/inter` + all 30 `kip` stylesheets (`tokens.css` through `ui.css`)
- [x] **Unified Session & Providers**: `AppProviders` (`authStore` + `/users/me`) + `QueryClientProvider` + `I18nProvider` (`en`/`sw`) + `AuthProvider`
- [x] **All 9 `kip` Portals Preserved (`.jsx`)**: `/`, `/auth/*`, `/student/auth/*`, `/donor/*`, `/student/*`, `/clerk/*`, `/inventory/*`, `/committee/*`, `/finance/*`, `/auditor/*`, `/admin/*` (including Global Search, Help Center, role tabs)
- [x] **All `aldo` DApp & Forensic Views Integrated (`.tsx`)**:
  - Public & Donor: `/trace`, `/claim`, `/donor/claim`, `/dashboard`, `/wall`, `/reports`, `/donor/dapp` (`TracePage.tsx`, `SankeyFlow.tsx`, `ClaimPreferencesPage.tsx`, `DonorPortalPage.tsx`)
  - Committee & Inventory: `/committee/signing`, `/committee/cases`, `/committee/cases/new`, `/inventory/pharmacy` (`SigningQueuePage.tsx`, `CasesPage.tsx`, `NewCasePage.tsx`, `PharmacyItemPage.tsx`)
  - Auditor & Reports: `/auditor/fund-flow-dag`, `/auditor/forensic-rules`, `/auditor/quarterly-reports` (`FundFlowGraphPage.tsx`, `AlertsPage.tsx`, `ReportsPage.tsx`)
  - Standalone Malkia Workspace: `/app/*` (`AppLayout.tsx`)
- [x] **Live Browser `Web3.js` + MetaMask EIP-712 Signing**: `frontend/src/features/signing/SigningQueuePage.tsx` (with Demo Signatory fallback) & `frontend/src/features/signing/signing.test.tsx`

## 6. Infrastructure, Docs & Full Verification
- [x] **Docker & Nginx (`kip`)**: `infrastructure/docker/*.Dockerfile` (`node:22-bookworm-slim` + `openssl`), `infrastructure/nginx/nginx.conf`
- [x] **Unified Documentation (`kip` + `aldo`)**: `README.md`, `documentation/*` (`setup-and-running.md`, `super admin setup.md`, `assignable permissions.md`), `docs/*` (`fullPRD.md`, `ARCHITECTURE.md`, `HASHING_SPECIFICATION.md`, `BACKEND_GAP_LIST.md`, track guides A–E)
- [x] **Full Verification Pass**: Smart contracts compile & test, Prisma validate/generate/migrate/seed, Backend lint/build/unit/security/API/integration tests, Frontend typecheck/lint/unit/Vite production build
