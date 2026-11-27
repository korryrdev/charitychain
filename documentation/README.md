# CharityChain Engineering Documentation Hub

Welcome to the single authoritative documentation directory for **CharityChain**—a blockchain-notarized campus donation, student assistance, physical inventory, and forensic fund-flow analysis platform serving **Malkia**.

---

## Start Here (Recommended Reading Order)

| Audience | Recommended Starting Documents |
| --- | --- |
| **Evaluators & Lecturers** | 1. [Product Requirements Document (PRD)](./requirements/product-requirements-document.md)<br/>2. [Brief & Rules Traceability Matrix](./testing/traceability-matrix.md)<br/>3. [Acceptance Criteria & G01–G37 Checklist](./requirements/acceptance-criteria.md)<br/>4. [Setup & Running Guide](./setup-and-running.md) |
| **Software Engineers** | 1. [Architecture Overview](./architecture/overview.md)<br/>2. [Project Structure](./project-structure.md)<br/>3. [Team Workflow](./engineering/workflow.md)<br/>4. Track guides under [Engineering Tracks](./engineering/tracks/track-a-blockchain.md) |
| **Operators & Auditors** | 1. [System Dashboards](./system-dashboards.md)<br/>2. [Reconciliation & Forensics Operations](./operations/reconciliation.md)<br/>3. [Access Control & 55 Permissions](./security/access-control.md)<br/>4. [Incident Response Runbooks](./security/incident-response.md) |

---

## Complete Documentation Index

### Overview & Top-Level Guides
* [Root README](../README.md) — Quick start, architecture diagram, workspace scripts
* [Setup and Running Guide](./setup-and-running.md) — Docker Compose, Prisma migrations, `db:seed`, dev servers, Super Admin provisioning
* [System Dashboards](./system-dashboards.md) — All 9 role portals, public trace, recognition privacy rules, and `.tsx` governance screens
* [Project Structure](./project-structure.md) — Complete monorepo directory layout and file inventory

### Requirements (`requirements/`)
* [Product Requirements Document](./requirements/product-requirements-document.md) — Authoritative 24-section PRD (`fullPRD`)
* [Functional Requirements](./requirements/functional-requirements.md) — Structured `FR-INT`, `FR-CASE`, `FR-FLOW`, `FR-TRACE`, `FR-REP`, `FR-FOR`, `FR-AUD`, `FR-AUTH`, `FR-DON` catalogue
* [Non-Functional Requirements](./requirements/non-functional-requirements.md) — Availability, latency, integer accounting, security, privacy, localization
* [Acceptance Criteria & Gap Verification](./requirements/acceptance-criteria.md) — PRD §3.3 metrics, IC0–IC4 checkpoints, and verified `G01`–`G37` checklist

### Architecture (`architecture/`) & Decisions (`decisions/`)
* [Architecture Overview](./architecture/overview.md) — System design, runtime flows, integration contracts, hashing summary
* [Canonical Hashing Specification](./architecture/hashing-specification.md) — Byte-exact hashing, domain separators, EIP-712, and Golden Vectors 1–5
* [C4 System Context](./architecture/system-context.md) — External actors, fiat/item rails, IPFS, Chainlink, and Polygon boundary
* [C4 Runtime Containers](./architecture/containers.md) — Containers, host ports, Dockerfiles, and Nginx reverse proxy
* [Monetary Fund-Flow Architecture](./architecture/money-flow.md) — Daraja/Bank intake, 2-of-3 signing, FIFO lots, Sankey & 5-col DAG
* [Physical-Goods Flow Architecture](./architecture/goods-flow.md) — Pharmacy quick-log, desk intake, independent confirmations, shrinkage checks
* [Trust Boundaries & Verification](./architecture/trust-boundaries.md) — Zone separation & trustless browser `Web3.js` RPC verification
* [Architecture Decision Records (ADRs)](./decisions/README.md) — Accepted decisions `ADR-0001` through `ADR-0010`
* [Zero-Loss Unification Ledger](./decisions/unification-ledger.md) — Complete asset merge record across `aldo` and `kip`/`main`

### API & Database (`api/`, `database/`)
* [API Endpoints Reference](./api/endpoints.md) — Health, Public, Daraja, Webhooks, and Authenticated `/api/v1` endpoints
* [Authentication & Signatory Wallets](./api/authentication.md) — Sessions, CSRF bridge, MUST student auth, TOTP MFA, EIP-712 wallets
* [Webhooks & Daraja Callbacks](./api/webhooks.md) — Tokenized C2B ingestion, raw immutability, STK/B2C/B2B result codes
* [Error Envelope & Error Codes](./api/error-codes.md) — Standard response format & all 42 `ERROR_CODES`
* [Database Data Model](./database/data-model.md) — ER overview, 86 Prisma models, UUID & minor-unit conventions
* [Migrations & Admin Seeder](./database/migrations.md) — 26 migrations, `db:seed` / `db:seed:admin`, Prisma CLI wrapper
* [Append-Only Ledger & Triggers](./database/ledger.md) — PostgreSQL `BEFORE UPDATE OR DELETE` triggers, FIFO lots, outbox
* [Data Retention & Compliance](./database/retention.md) — Kenya Data Protection Act 2019 boundaries
* [University Simulation Rules](./database/university-simulation-rules.md) — Deterministic `CTxxx/xxxxxx/yy` dataset & test fixture rules

### Blockchain, Security, Deployment & Operations (`blockchain/`, `security/`, `deployment/`, `operations/`)
* [Smart Contracts Specification](./blockchain/contracts.md) — All 7 Solidity `0.8.28` contracts & EIP-712 `"CharityChain CaseWorkflow"` v1 domain
* [Deployments, Networks & ABIs](./blockchain/deployments.md) — Hardhat `localhost` (`31337`) / `polygonAmoy` (`80002`), deploy script, `shared/abis/`
* [Audit Anchoring, IPFS & Chainlink](./blockchain/audit-anchoring.md) — Transactional outbox, AES-256-GCM IPFS, daily Merkle digest & Chainlink FX/Automation
* [Threat Model & Controls](./security/threat-model.md) — 14 attack vectors and defense-in-depth mitigations
* [Access Control, 14 Roles & 55 Permissions](./security/access-control.md) — Unified RBAC matrix, mandatory 2FA, segregation of duties
* [Secrets & Key Management](./security/secrets.md) — `.env` custody boundaries & signatory hardware-wallet isolation
* [Privacy & Donor Anonymity](./security/privacy.md) — Keyed `donorRef`, `ANONYMOUS` default, preview & screening, k-anonymity `>= 5`
* [Incident Response Runbooks](./security/incident-response.md) — Contract pause, key/signatory rotation, R17 mismatch, takedowns, outbox recovery
* [Environments & Ports](./deployment/environments.md) — Local, Test, Staging, and Production profiles
* [Deployment Guide](./deployment/deployment-guide.md) — Docker Compose build, migrations, seeding, contract deployment, smoke tests
* [Rollback & Recovery Policy](./deployment/rollback.md) — Safe stateless rollback, forward migrations, non-proxy contract recovery
* [Reconciliation & Forensics Operations](./operations/reconciliation.md) — Daraja/Bank/Inventory/FIFO reconciliation & simulator usage
* [Monitoring & Health Probes](./operations/monitoring.md) — Health endpoints, Pino correlation logs, integration alerts
* [Backup, Restore & Integrity Verification](./operations/backup-and-restore.md) — `pg_dump`/`pg_restore`, IPFS datastore, post-restore Merkle verification

### Testing (`testing/`) & Engineering (`engineering/`)
* [Testing Strategy & Quality Gates](./testing/strategy.md) — 5-workspace automated pyramid (284 passing tests) & 12-month simulator
* [Test Suite Inventory](./testing/test-cases.md) — Concrete unit, security, API, integration, UI, DB, and contract test suites
* [Brief & Rules Traceability Matrix](./testing/traceability-matrix.md) — Lecturer deliverables, tech stack, and forensic rules `R01`–`R20`
* [Team Workflow](./engineering/workflow.md) — Git flow, interface change protocol, local dev commands, CI quality gates
* [Backend Breakdown](./engineering/backend-breakdown.md) — Detailed directory structure across 40 Express modules & integrations
* [Frontend Breakdown](./engineering/frontend-breakdown.md) — Vite/TS/JSX coexistence, CSS `@layer`, dual themes, `Web3.js` DApp features
* Track Guides: [Track A: Blockchain](./engineering/tracks/track-a-blockchain.md) | [Track B: Backend Core](./engineering/tracks/track-b-backend-core.md) | [Track C: Forensics & Integrity](./engineering/tracks/track-c-forensics-integrity.md) | [Track D: Frontend](./engineering/tracks/track-d-frontend.md) | [Track E: Platform, QA & Docs](./engineering/tracks/track-e-platform-qa.md)

### Role User Guides (`user-guides/`)
* [Donor Guide](./user-guides/donor.md) — Walletless `/trace`, `/claim` preferences, badges & SVG certificates, `/donor` portal
* [Student Guide](./user-guides/student.md) — MUST email registration, simulated record link, aid applications, goods packs, appeals
* [Clerk & Pharmacy Guide](./user-guides/clerk.md) — Desk physical intake, `/inventory/pharmacy` quick log, student handover, daily reconciliation
* [Committee & Signatory Guide](./user-guides/committee.md) — Sub-group cases, segregated review, 2-of-3 MetaMask `Web3.js` EIP-712 signing, quarterly close
* [Finance & Treasurer Guide](./user-guides/finance.md) — Maker-checker bank deposits, CSV statement reconciliation, ceiling-checked payouts
* [Forensic Auditor Guide](./user-guides/auditor.md) — 5-col Fund-Flow DAG, R01–R20 alert triage, Benford checks, blockchain/Merkle proof audits
* [Administrator Guide](./user-guides/administrator.md) — `/admin/users` staff provisioning across 14 roles & 55 permissions, policies, governance guardrails
