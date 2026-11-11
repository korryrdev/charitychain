# CharityChain — Complete Project Structure

## 1. Purpose and Architecture

CharityChain is organized as a JavaScript and Solidity monorepo. The repository separates the public and role-based React interface, the Node.js/Express API, PostgreSQL/Prisma data layer, Solidity smart contracts, shared definitions, integration simulators, tests, deployment assets, scripts, and documentation.

The project uses:

- **Frontend:** React with JavaScript
- **Backend:** Node.js with Express and JavaScript
- **Database:** PostgreSQL with Prisma ORM and versioned migrations
- **Blockchain:** Solidity contracts on Polygon, accessed through Web3.js
- **Evidence storage:** IPFS for encrypted or non-sensitive content-addressed evidence
- **External integrations:** Safaricom Daraja, SMS provider, optional bank/payment adapter, and Chainlink only where a genuine oracle requirement exists
- **Testing:** unit, integration, contract, end-to-end, security, reconciliation, and acceptance tests

The committee approves ordinary fiat payments inside the application. Committee members do not need cryptocurrency wallets. The backend records approved workflow commitments and evidence hashes on-chain through a secured system integration. Blockchain is a tamper-evident audit layer; it does not hold or directly control M-Pesa or bank funds.

## 2. Proposed Repository Tree

```text
charitychain/
├── README.md
├── LICENSE
├── package.json
├── package-lock.json
├── .gitignore
├── .editorconfig
├── .env.example
├── .nvmrc
├── docker-compose.yml
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   ├── manifest.webmanifest
│   │   └── static/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── app/
│       │   ├── router.jsx
│       │   ├── providers.jsx
│       │   ├── queryClient.js
│       │   └── routeConfig.js
│       ├── assets/
│       │   ├── images/
│       │   ├── icons/
│       │   └── styles/
│       ├── components/
│       │   ├── common/
│       │   ├── forms/
│       │   ├── tables/
│       │   ├── charts/
│       │   ├── feedback/
│       │   ├── navigation/
│       │   ├── privacy/
│       │   └── status/
│       ├── layouts/
│       │   ├── PublicLayout.jsx
│       │   ├── AuthLayout.jsx
│       │   ├── CommunityLayout.jsx
│       │   ├── OperationsLayout.jsx
│       │   └── GovernanceLayout.jsx
│       ├── pages/
│       │   ├── public/
│       │   ├── auth/
│       │   ├── donor/
│       │   ├── student/
│       │   ├── clerk/
│       │   ├── committee/
│       │   ├── finance/
│       │   ├── auditor/
│       │   ├── admin/
│       │   └── errors/
│       ├── features/
│       │   ├── authentication/
│       │   ├── authorization/
│       │   ├── donorIdentity/
│       │   ├── moneyDonations/
│       │   ├── physicalDonations/
│       │   ├── studentVetting/
│       │   ├── assistanceApplications/
│       │   ├── committeeApprovals/
│       │   ├── disbursements/
│       │   ├── inventory/
│       │   ├── goodsCollection/
│       │   ├── transparency/
│       │   ├── recognitionTiers/
│       │   ├── forensicAnalytics/
│       │   ├── auditTrail/
│       │   ├── notifications/
│       │   └── complaints/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       ├── utils/
│       ├── constants/
│       ├── validation/
│       ├── accessibility/
│       └── tests/
│
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── config/
│   │   ├── bootstrap/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── sessions/
│   │   │   ├── donors/
│   │   │   ├── publicProfiles/
│   │   │   ├── recognition/
│   │   │   ├── moneyDonations/
│   │   │   ├── physicalDonations/
│   │   │   ├── confirmations/
│   │   │   ├── students/
│   │   │   ├── universityRecords/
│   │   │   ├── vetting/
│   │   │   ├── applications/
│   │   │   ├── committee/
│   │   │   ├── approvals/
│   │   │   ├── disbursements/
│   │   │   ├── payments/
│   │   │   ├── reconciliation/
│   │   │   ├── inventory/
│   │   │   ├── goodsCollections/
│   │   │   ├── evidence/
│   │   │   ├── blockchainAudit/
│   │   │   ├── forensicAnalytics/
│   │   │   ├── auditLogs/
│   │   │   ├── notifications/
│   │   │   ├── complaints/
│   │   │   ├── reports/
│   │   │   ├── transparency/
│   │   │   ├── policies/
│   │   │   ├── integrations/
│   │   │   └── systemHealth/
│   │   ├── integrations/
│   │   │   ├── mpesa/
│   │   │   ├── bank/
│   │   │   ├── sms/
│   │   │   ├── ipfs/
│   │   │   ├── blockchain/
│   │   │   └── chainlink/
│   │   ├── jobs/
│   │   ├── events/
│   │   ├── security/
│   │   ├── observability/
│   │   ├── errors/
│   │   ├── utils/
│   │   └── constants/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── api/
│       ├── security/
│       ├── reconciliation/
│       └── fixtures/
│
├── database/
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   ├── seeds/
│   │   ├── roles.seed.js
│   │   ├── policies.seed.js
│   │   ├── recognitionTiers.seed.js
│   │   ├── goodsCatalog.seed.js
│   │   ├── committee.seed.js
│   │   └── mockUniversity.seed.js
│   ├── fixtures/
│   ├── views/
│   ├── functions/
│   ├── scripts/
│   │   ├── migrate.js
│   │   ├── seed.js
│   │   ├── resetTestDatabase.js
│   │   ├── backup.js
│   │   └── verifyConstraints.js
│   └── tests/
│
├── blockchain/
│   ├── package.json
│   ├── hardhat.config.js
│   ├── contracts/
│   │   ├── CharityChainAccess.sol
│   │   ├── DonationAuditRegistry.sol
│   │   ├── ApplicationAuditRegistry.sol
│   │   ├── ApprovalAuditRegistry.sol
│   │   ├── DisbursementAuditRegistry.sol
│   │   ├── InventoryAuditRegistry.sol
│   │   ├── EvidenceRegistry.sol
│   │   ├── interfaces/
│   │   └── libraries/
│   ├── scripts/
│   │   ├── deploy.js
│   │   ├── verify.js
│   │   ├── grantRoles.js
│   │   └── exportAbis.js
│   ├── deployments/
│   │   ├── localhost/
│   │   ├── polygon-amoy/
│   │   └── polygon-mainnet/
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── invariants/
│   │   └── fixtures/
│   ├── abi/
│   └── coverage/
│
├── shared/
│   ├── package.json
│   └── src/
│       ├── constants/
│       ├── enums/
│       ├── validation/
│       ├── permissions/
│       ├── statusMachines/
│       ├── eventSchemas/
│       ├── apiContracts/
│       └── utils/
│
├── simulators/
│   ├── mpesa-simulator/
│   ├── sms-simulator/
│   ├── bank-simulator/
│   └── blockchain-simulator/
│
├── tests/
│   ├── e2e/
│   │   ├── donorMoneyFlow/
│   │   ├── physicalDonationFlow/
│   │   ├── studentVettingFlow/
│   │   ├── committeeApprovalFlow/
│   │   ├── fiatDisbursementFlow/
│   │   ├── goodsCollectionFlow/
│   │   └── publicTransparencyFlow/
│   ├── acceptance/
│   ├── performance/
│   ├── resilience/
│   ├── privacy/
│   └── test-data/
│
├── scripts/
│   ├── setup.js
│   ├── dev.js
│   ├── test.js
│   ├── lint.js
│   ├── build.js
│   ├── deploy.js
│   ├── rotateSecrets.js
│   └── verifyEnvironment.js
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── environments/
│   │   ├── development/
│   │   ├── test/
│   │   ├── staging/
│   │   └── production/
│   ├── monitoring/
│   ├── backups/
│   └── runbooks/
│
├── .github/
│   ├── workflows/
│   │   ├── frontend-ci.yml
│   │   ├── backend-ci.yml
│   │   ├── database-ci.yml
│   │   ├── contracts-ci.yml
│   │   ├── e2e-ci.yml
│   │   └── security-ci.yml
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
└── documentation/
    ├── system dashboards.md
    ├── project structure.md
    ├── requirements/
    ├── architecture/
    ├── api/
    ├── database/
    ├── blockchain/
    ├── security/
    ├── testing/
    ├── deployment/
    ├── operations/
    ├── user-guides/
    └── decisions/
```

## 3. Root Files

### `README.md`

Project overview, architecture summary, prerequisites, local setup, test commands, environment profiles, and links to detailed documentation.

### `package.json`

Defines npm workspaces and root commands for installing dependencies, starting the full development system, testing all components, building releases, applying migrations, and deploying contracts.

### `.env.example`

Lists required variable names without containing secrets. Variables cover PostgreSQL, sessions, encryption keys, Daraja, SMS, IPFS, blockchain RPC, system signing keys, public URLs, and observability.

### `docker-compose.yml`

Starts local PostgreSQL, IPFS, the API, the frontend, and optional integration simulators. Production secrets must not be stored in this file.

## 4. Frontend Structure

### `app/`

Owns application bootstrap, route definitions, global providers, query caching, authentication restoration, and portal navigation.

### `layouts/`

- `PublicLayout.jsx`: public website
- `AuthLayout.jsx`: registration, login, recovery, and verification
- `CommunityLayout.jsx`: donor and student portals
- `OperationsLayout.jsx`: clerk, inventory, and finance operations
- `GovernanceLayout.jsx`: committee, auditor, and administrator portals

### `pages/`

Route-level screens only. Business logic belongs in feature folders.

Public pages include Home, How It Works, Transparency, Donor Recognition, Donation Tracking, Goods Catalogue, Governance, Policies, Contact, Complaints, and Fraud Reporting.

Authenticated pages are divided among donor, student, clerk, committee, finance, auditor, and administrator roles.

### `features/`

Each feature contains its components, hooks, API calls, validation, state handling, and feature tests. Major features correspond directly to the agreed workflows: money donations, physical donations, needs vetting, approvals, disbursements, inventory, goods collection, transparency, recognition tiers, analytics, and complaints.

### `services/`

Contains the HTTP client, authentication token/cookie handling, request correlation, file retrieval, and safe API error mapping. The frontend never holds payment credentials, blockchain private keys, SMS secrets, or database credentials.

### `authorization/`

Controls route and component visibility for usability, but the backend remains the authoritative permission enforcement layer.

## 5. Backend Module Standard

Every domain under `backend/src/modules/` should follow a consistent internal structure:

```text
moduleName/
├── module.routes.js
├── module.controller.js
├── module.service.js
├── module.repository.js
├── module.validation.js
├── module.policy.js
├── module.events.js
├── module.mapper.js
├── module.errors.js
└── module.test.js
```

- **Routes:** HTTP endpoints and middleware order
- **Controller:** transport-level request and response handling
- **Service:** business rules and workflow orchestration
- **Repository:** Prisma/database operations
- **Validation:** request and domain validation
- **Policy:** authorization and ownership decisions
- **Events:** domain events emitted by successful operations
- **Mapper:** safe conversion between database entities and API responses
- **Errors:** domain-specific error definitions
- **Tests:** focused module behavior

## 6. Backend Domains

### Authentication and Security

`auth/`, `users/`, `roles/`, and `sessions/` implement:

- Donor and student registration
- Staff invitation and controlled role assignment
- Password hashing
- Email or SMS verification where required
- Login and logout
- Secure server-side sessions or short-lived access with refresh rotation
- Password reset
- Session revocation
- Account locking and rate limiting
- Optional multi-factor authentication for staff and committee members
- Role-based and permission-based authorization
- Security-event logging

Roles include Public, Donor, Student, Clerk, Inventory Supervisor, Committee Member, Finance Operator, Auditor, and Administrator. High-risk actions require explicit permissions, not only broad role names.

### Donor Identity and Recognition

`donors/`, `publicProfiles/`, and `recognition/` manage donor records, generated aliases, moderated alias edits, real-name display consent, public opt-out, contribution visibility, tier rules, money and goods badges, and recognition history.

### Monetary Donations

`moneyDonations/` creates donation intentions, provider references, tracking IDs, statuses, allocation records, receipts, reversals, and public-safe impact views.

The state machine is:

`CREATED -> PAYMENT_REQUESTED -> PROVIDER_PENDING -> CONFIRMED -> RECONCILED`

Exception states include Cancelled, Failed, Expired, Reversed, and Manual Review.

### Physical Donations and Confirmation

`physicalDonations/` records cash or goods proposals from clerks. `confirmations/` creates single-use, expiring donor confirmations and independently receives Yes or No.

The state machine is:

`DRAFT -> AWAITING_DONOR_CONFIRMATION -> CONFIRMED or REJECTED -> INSPECTION -> ACCEPTED or REJECTED -> INVENTORIED`

Physical cash continues through Deposit Pending, Deposit Matched, and Reconciled before becoming spendable.

### Students, University Records, and Vetting

`students/` stores application-specific student references. `universityRecords/` owns simulated authoritative records: registration number, programme, academic status, fee balance, payment history, exam calendars, finance blocks, HELB/scholarships, and assistance history.

`vetting/` computes explainable factors such as unmet balance, fragmented payments, repeated exam-period payments, finance blocks, aid reliance, remaining gap, previous help, and duplicate requests. It stores factor values, the policy version used, explanation, outcome, and review flags. It never stores only an unexplained score.

### Applications and Committee Approvals

`applications/` owns tuition and upkeep requests. `committee/` manages the active committee roster and conflicts. `approvals/` binds every decision to a specific application, amount, purpose, destination, semester, expiry, and authorization nonce.

The approval flow is:

`VETTED -> COMMITTEE_REVIEW -> 1_OF_2_APPROVALS -> APPROVED_FOR_DISBURSEMENT`

Alternative outcomes are Declined, Review Requested, Conflict Abstention, Expired, and Cancelled. A material application change invalidates existing approvals.

### Payments, Disbursements, and Reconciliation

`payments/` provides provider-independent payment records. `disbursements/` converts approved applications into tuition or upkeep payouts. `reconciliation/` verifies provider callbacks against status queries and account records.

The payout flow is:

`AUTHORIZED -> SUBMITTED -> PROVIDER_ACCEPTED -> CALLBACK_RECEIVED -> CONFIRMED -> RECONCILED`

Failures are never silently retried without idempotency protection. Changes to amount or destination require renewed committee approval.

### Inventory and Goods Collections

`inventory/` manages categories, items, batches, locations, inspection, reservations, adjustments, expiry, damage, and stock balances.

`goodsCollections/` enforces eligibility, category limits, quantity limits, collection periods, reservations, student confirmation, release, and receipt generation.

The collection flow is:

`ELIGIBILITY_CONFIRMED -> RESERVED -> AWAITING_STUDENT_CONFIRMATION -> CONFIRMED -> RELEASED -> COMPLETED`

No response produces Expired; No produces Rejected and a corrected proposal. Inventory remains reserved while confirmation is pending.

### Evidence, Blockchain Audit, and IPFS

`evidence/` creates canonical evidence documents, hashes, encryption metadata, retention rules, and access controls. Private student or payment evidence is encrypted before IPFS and is never exposed through a public gateway by default.

`blockchainAudit/` submits only minimal identifiers, commitments, hashes, timestamps, workflow outcomes, and correction links. It tracks pending transactions, confirmations, failures, and retries. It never places names, registration numbers, phone numbers, fee balances, or raw payment callbacks on-chain.

### Forensics, Audit, and Transparency

`forensicAnalytics/` runs deterministic anomaly rules for unreconciled money, duplicate callbacks, repeated failed confirmations, unusual clerk behavior, inventory adjustments, payout spikes, approval conflicts, and cash-deposit mismatches.

Anomalies follow:

`DETECTED -> TRIAGED -> INVESTIGATING -> CONFIRMED or DISMISSED -> RESOLVED`

`auditLogs/` records actor, action, target, result, time, request ID, reason, and before/after commitments for sensitive changes. `transparency/` publishes only reconciled and anonymized aggregates.

## 7. Integrations

Every provider integration follows an adapter interface so sandbox, simulator, and production implementations can be swapped without changing business modules.

### `mpesa/`

```text
mpesa/
├── mpesa.client.js
├── mpesa.auth.js
├── stkPush.adapter.js
├── c2b.adapter.js
├── b2c.adapter.js
├── b2b.adapter.js
├── callback.controller.js
├── callback.validation.js
├── transactionStatus.adapter.js
├── reconciliation.adapter.js
└── mpesa.mapper.js
```

It implements OAuth token caching, STK Push, incoming-payment callbacks, B2C/B2B requests, status queries, callback deduplication, idempotency, timeout handling, and redacted logging.

### `sms/`

Creates donor and student confirmation messages, one-time confirmation tokens or secure links, delivery tracking, expiry, retries, and templates. The clerk cannot confirm on behalf of the donor or student.

### `bank/`

Defines a provider-neutral adapter for creating references, validating webhooks, querying transactions, reconciling settlements, handling fees, and recording reversals. A simulator is used until a real bank or card provider is approved.

### `ipfs/`

Canonicalizes files, encrypts protected evidence, uploads content, verifies returned CIDs, pins required content, checks availability, retrieves authorized evidence, and records retention metadata.

### `blockchain/`

Loads contract ABIs and addresses, signs system transactions using a protected service key, submits hashes, waits for confirmations, reads audit events, and recovers safely from RPC failures.

### `chainlink/`

Remains isolated and optional. It is used only if the final design requires verifiable off-chain data delivery to a smart contract. Ordinary SMS sending, M-Pesa requests, and normal backend jobs do not require Chainlink.

## 8. Database Design and Migrations

### Core Identity Tables

- `users`
- `credentials`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `sessions`
- `verification_challenges`
- `password_reset_tokens`
- `security_events`

### Donor and Recognition Tables

- `donor_profiles`
- `public_profiles`
- `public_identity_preferences`
- `recognition_tiers`
- `recognition_history`

### Monetary Donation Tables

- `donations`
- `donation_allocations`
- `payment_attempts`
- `payment_provider_events`
- `payment_callbacks`
- `payment_reconciliations`
- `donation_receipts`

### Physical Donation and Inventory Tables

- `physical_donations`
- `physical_donation_lines`
- `confirmation_requests`
- `confirmation_responses`
- `goods_categories`
- `inventory_items`
- `inventory_batches`
- `inventory_locations`
- `inventory_movements`
- `inventory_adjustments`
- `inventory_reservations`
- `stock_counts`

### Student and Vetting Tables

- `students`
- `university_records`
- `student_payment_history`
- `academic_semesters`
- `exam_calendars`
- `student_finance_blocks`
- `student_aid_records`
- `vetting_policies`
- `vetting_runs`
- `vetting_factors`
- `vetting_decisions`

### Application and Approval Tables

- `assistance_applications`
- `application_status_history`
- `committee_memberships`
- `conflict_declarations`
- `approval_decisions`
- `approval_invalidations`
- `fund_commitments`

### Disbursement Tables

- `disbursements`
- `disbursement_attempts`
- `payout_destinations`
- `provider_transactions`
- `reconciliation_runs`
- `reconciliation_items`
- `reversals`
- `financial_ledger_accounts`
- `financial_ledger_entries`

### Goods Collection Tables

- `goods_eligibility_policies`
- `student_goods_eligibility`
- `goods_collection_requests`
- `goods_collection_lines`
- `goods_collection_confirmations`
- `goods_release_receipts`

### Evidence, Audit, and Operations Tables

- `evidence_records`
- `ipfs_objects`
- `blockchain_anchors`
- `blockchain_transactions`
- `audit_events`
- `anomaly_rules`
- `anomaly_cases`
- `investigation_actions`
- `notifications`
- `notification_deliveries`
- `complaints`
- `appeals`
- `policy_versions`
- `system_jobs`
- `integration_health_events`

### Migration Rules

- Every schema change creates a new immutable Prisma migration directory.
- Applied production migrations are never edited.
- Destructive changes require staged migrations and verified backups.
- Seed scripts are idempotent and environment-aware.
- Money uses fixed decimal or integer minor units, never floating-point values.
- External provider transaction IDs have uniqueness constraints.
- Idempotency keys protect payment and callback processing.
- Status transitions are recorded in history tables.
- Foreign keys and check constraints enforce critical invariants.
- Public aliases are unique under the selected normalization policy.
- One active confirmation token exists per pending proposal.
- One student cannot receive the same approved assistance twice.
- Ledger entries balance and cannot be silently overwritten.

## 9. Smart Contracts

### `CharityChainAccess.sol`

Defines controlled system-writer, auditor, pauser, and administrator roles for contract operations. These are infrastructure identities, not committee-user wallets.

### Audit Registries

- `DonationAuditRegistry.sol`: confirmed and corrected donation commitments
- `ApplicationAuditRegistry.sol`: application and vetting outcome commitments
- `ApprovalAuditRegistry.sol`: committee threshold result and authorization commitment
- `DisbursementAuditRegistry.sol`: provider outcome and reconciliation evidence
- `InventoryAuditRegistry.sol`: important receipt, adjustment, and release commitments
- `EvidenceRegistry.sol`: CID or evidence hashes and supersession links

Contracts provide append-only events, correction/supersession events, duplicate commitment protection, role checks, emergency pause, and versioning. They do not store personal data, transfer fiat money, or allow unbounded loops.

## 10. Shared Package

The `shared/` package prevents frontend, backend, tests, and simulators from inventing different meanings for the same data.

It contains:

- Status enums and transition definitions
- Role and permission names
- Validation schemas safe to share
- API request and response contracts
- Event payload schemas
- Donation and payout types
- Inventory units and categories
- Error codes
- Public-safe field lists

Server-only secrets and authorization decisions never live in the shared browser bundle.

## 11. Background Jobs and Events

`backend/src/jobs/` contains bounded, retry-safe workers for:

- Payment status verification
- M-Pesa and bank reconciliation
- Expired confirmation handling
- Inventory reservation expiry
- Disbursement retry review
- Blockchain anchoring
- IPFS availability checks
- Anomaly scans
- Tier recalculation
- Notification delivery
- Transparency aggregate refresh
- Retention and cleanup policies

Every job uses a unique job key, records attempts, limits retries, and routes exhausted failures to manual review.

Domain events under `events/` decouple actions such as DonationConfirmed, ApplicationVetted, ApprovalThresholdReached, DisbursementReconciled, GoodsReceived, and GoodsReleased.

## 12. Security Structure

`backend/src/security/` contains:

- Password hashing and session security
- CSRF protection where cookie sessions are used
- CORS policy
- Content Security Policy configuration
- Rate limits and abuse protection
- Request-body and upload limits
- Input normalization and validation
- Sensitive-field redaction
- Encryption and key-version handling
- Webhook authentication and replay protection
- Idempotency enforcement
- Secure receipt and tracking-ID generation
- Staff MFA support
- Account and session revocation
- Audit-event creation

Secrets exist only in environment-specific secret storage. They are never committed, returned to the browser, or written to logs.

## 13. Testing Structure

### Frontend Tests

- Components and form validation
- Route and role guards
- Accessibility and keyboard navigation
- Loading, empty, failure, and retry states
- Privacy preference previews
- Dashboard calculations and status rendering

### Backend Unit Tests

- Domain rules and status transitions
- Permission checks
- Vetting-factor calculations and explanations
- Recognition-tier calculations
- Inventory limits
- Approval invalidation
- Payment idempotency

### Integration and API Tests

- PostgreSQL repositories and transactions
- Authentication, session revocation, and staff MFA
- M-Pesa, SMS, bank, IPFS, and blockchain adapters
- Callback signature, duplication, and replay cases
- Reconciliation and ledger balancing
- Error contracts and privacy-safe responses

### Smart-Contract Tests

- Role enforcement
- Duplicate commitment prevention
- Pause and resume
- Correction and supersession
- Event accuracy
- Unauthorized writes
- Invariants, gas usage, and deployment upgrade/version rules

### End-to-End Tests

- Donor registration through reconciled money donation
- Clerk entry through donor-confirmed physical donation
- Student record through vetting and committee decision
- Two distinct committee approvals through fiat disbursement
- Goods eligibility through student confirmation and release
- Public alias, real-name toggle, opt-out, and recognition tier
- Public transparency without privacy leakage
- Failed, delayed, duplicate, reversed, and disputed flows

### Critical Invariants

- No payout without two distinct active committee approvals.
- No material change can reuse old approvals.
- No application is paid twice.
- Callback receipt alone cannot create reconciled money.
- Failed payouts release or retain commitments according to policy.
- Goods cannot be released before student confirmation.
- Inventory cannot become negative.
- Rejected confirmations remain auditable.
- Public responses never expose protected student or donor data.
- On-chain records contain no direct personal data.
- Every financial ledger transaction balances.

## 14. Environments and Deployment

Four environments are maintained:

- **Development:** local services and simulators
- **Test:** isolated automated test databases and local contracts
- **Staging:** production-like sandbox integrations and Polygon testnet
- **Production:** approved live integrations and Polygon production deployment

Each environment has separate databases, secrets, provider credentials, contract addresses, IPFS settings, and public URLs. Production deployment requires successful tests, migration review, backup verification, contract-address verification, and rollback instructions.

## 15. Documentation Set

The final `documentation/` directory should contain:

- `system dashboards.md`
- `project structure.md`
- Requirements and acceptance criteria
- Architecture overview and data-flow diagrams
- API specification
- Database entity and migration guide
- Smart-contract specification
- Threat model and security controls
- Privacy and data-retention policy
- Vetting-policy explanation
- Money and goods reconciliation rules
- Test strategy and traceability matrix
- Deployment and rollback guide
- Incident-response and recovery runbooks
- User guides for every role
- Architecture decision records

## 16. Expanded Implementation-Ready File Map

This section expands the high-level tree into the concrete files expected when implementation begins. A file should be created only when its responsibility is implemented; empty placeholder files should not be added merely to reproduce the tree.

### 16.1 Expanded Frontend

```text
frontend/src/
├── main.jsx
├── App.jsx
├── app/
│   ├── router.jsx
│   ├── routeConfig.js
│   ├── providers.jsx
│   ├── queryClient.js
│   ├── ErrorBoundary.jsx
│   └── StartupGate.jsx
├── layouts/
│   ├── PublicLayout.jsx
│   ├── AuthLayout.jsx
│   ├── CommunityLayout.jsx
│   ├── OperationsLayout.jsx
│   ├── GovernanceLayout.jsx
│   └── components/
│       ├── AppHeader.jsx
│       ├── AppSidebar.jsx
│       ├── Breadcrumbs.jsx
│       ├── MobileNavigation.jsx
│       └── UserMenu.jsx
├── pages/
│   ├── public/
│   │   ├── HomePage.jsx
│   │   ├── HowItWorksPage.jsx
│   │   ├── TransparencyPage.jsx
│   │   ├── DonorRecognitionPage.jsx
│   │   ├── TrackDonationPage.jsx
│   │   ├── GoodsCataloguePage.jsx
│   │   ├── GovernancePage.jsx
│   │   ├── PoliciesPage.jsx
│   │   ├── PrivacyPage.jsx
│   │   ├── ContactPage.jsx
│   │   ├── ComplaintPage.jsx
│   │   └── FraudReportPage.jsx
│   ├── auth/
│   │   ├── RegisterPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── VerifyAccountPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   ├── MfaChallengePage.jsx
│   │   └── SessionExpiredPage.jsx
│   ├── donor/
│   │   ├── DonorDashboardPage.jsx
│   │   ├── DonateMoneyPage.jsx
│   │   ├── DeclareGoodsPage.jsx
│   │   ├── DonationHistoryPage.jsx
│   │   ├── DonationDetailPage.jsx
│   │   ├── ReceiptsPage.jsx
│   │   ├── PublicIdentityPage.jsx
│   │   └── DonorNotificationsPage.jsx
│   ├── student/
│   │   ├── StudentDashboardPage.jsx
│   │   ├── UniversityRecordPage.jsx
│   │   ├── AssistanceApplicationPage.jsx
│   │   ├── VettingResultPage.jsx
│   │   ├── ApplicationTimelinePage.jsx
│   │   ├── StudentGoodsPage.jsx
│   │   ├── GoodsRequestPage.jsx
│   │   ├── CollectionHistoryPage.jsx
│   │   └── StudentAppealsPage.jsx
│   ├── clerk/
│   │   ├── ClerkDashboardPage.jsx
│   │   ├── ReceiveDonationPage.jsx
│   │   ├── PendingConfirmationsPage.jsx
│   │   ├── InspectGoodsPage.jsx
│   │   ├── InventoryPage.jsx
│   │   ├── StudentCollectionPage.jsx
│   │   ├── RejectedTransactionsPage.jsx
│   │   └── DailyReconciliationPage.jsx
│   ├── committee/
│   │   ├── CommitteeDashboardPage.jsx
│   │   ├── ReviewQueuePage.jsx
│   │   ├── ApplicationReviewPage.jsx
│   │   ├── ApprovalHistoryPage.jsx
│   │   └── FundingCommitmentsPage.jsx
│   ├── finance/
│   │   ├── FinanceDashboardPage.jsx
│   │   ├── ApprovedDisbursementsPage.jsx
│   │   ├── PayoutDetailPage.jsx
│   │   ├── ReconciliationPage.jsx
│   │   └── PaymentExceptionsPage.jsx
│   ├── auditor/
│   │   ├── AuditorDashboardPage.jsx
│   │   ├── MoneyAuditPage.jsx
│   │   ├── GoodsAuditPage.jsx
│   │   ├── AnomalyCasesPage.jsx
│   │   ├── InvestigationPage.jsx
│   │   └── BlockchainAuditPage.jsx
│   ├── admin/
│   │   ├── AdminDashboardPage.jsx
│   │   ├── UsersAndRolesPage.jsx
│   │   ├── PolicyConfigurationPage.jsx
│   │   ├── MockUniversityDataPage.jsx
│   │   ├── InventoryConfigurationPage.jsx
│   │   ├── IntegrationHealthPage.jsx
│   │   └── SecurityIncidentsPage.jsx
│   └── errors/
│       ├── NotFoundPage.jsx
│       ├── ForbiddenPage.jsx
│       ├── ServiceUnavailablePage.jsx
│       └── UnexpectedErrorPage.jsx
├── features/
│   ├── authentication/
│   │   ├── components/LoginForm.jsx
│   │   ├── components/RegisterForm.jsx
│   │   ├── components/MfaForm.jsx
│   │   ├── hooks/useAuth.js
│   │   ├── hooks/useSession.js
│   │   ├── services/auth.api.js
│   │   ├── validation/auth.schema.js
│   │   └── tests/authentication.test.jsx
│   ├── authorization/
│   │   ├── components/ProtectedRoute.jsx
│   │   ├── components/PermissionGate.jsx
│   │   ├── hooks/usePermissions.js
│   │   ├── permissions.js
│   │   └── tests/authorization.test.jsx
│   ├── donorIdentity/
│   │   ├── components/PublicIdentityForm.jsx
│   │   ├── components/PublicProfilePreview.jsx
│   │   ├── services/donorIdentity.api.js
│   │   ├── validation/publicIdentity.schema.js
│   │   └── tests/donorIdentity.test.jsx
│   ├── moneyDonations/
│   │   ├── components/DonationForm.jsx
│   │   ├── components/PaymentMethodSelector.jsx
│   │   ├── components/DonationStatus.jsx
│   │   ├── components/DonationTimeline.jsx
│   │   ├── hooks/useDonation.js
│   │   ├── services/moneyDonations.api.js
│   │   ├── validation/donation.schema.js
│   │   └── tests/moneyDonations.test.jsx
│   ├── physicalDonations/
│   │   ├── components/PhysicalDonationForm.jsx
│   │   ├── components/DonationLineEditor.jsx
│   │   ├── components/ConfirmationStatus.jsx
│   │   ├── services/physicalDonations.api.js
│   │   ├── validation/physicalDonation.schema.js
│   │   └── tests/physicalDonations.test.jsx
│   ├── studentVetting/
│   │   ├── components/VettingFactors.jsx
│   │   ├── components/VettingExplanation.jsx
│   │   ├── components/RecordDiscrepancyAlert.jsx
│   │   ├── services/vetting.api.js
│   │   └── tests/studentVetting.test.jsx
│   ├── assistanceApplications/
│   │   ├── components/ApplicationForm.jsx
│   │   ├── components/ApplicationStatus.jsx
│   │   ├── components/ApplicationTimeline.jsx
│   │   ├── services/applications.api.js
│   │   ├── validation/application.schema.js
│   │   └── tests/applications.test.jsx
│   ├── committeeApprovals/
│   │   ├── components/ApprovalPanel.jsx
│   │   ├── components/DecisionForm.jsx
│   │   ├── components/ConflictDeclaration.jsx
│   │   ├── components/ApprovalProgress.jsx
│   │   ├── services/approvals.api.js
│   │   └── tests/committeeApprovals.test.jsx
│   ├── disbursements/
│   │   ├── components/PayoutStatus.jsx
│   │   ├── components/PayoutTimeline.jsx
│   │   ├── components/ReconciliationEvidence.jsx
│   │   ├── services/disbursements.api.js
│   │   └── tests/disbursements.test.jsx
│   ├── inventory/
│   │   ├── components/InventoryTable.jsx
│   │   ├── components/StockMovementForm.jsx
│   │   ├── components/BatchInspector.jsx
│   │   ├── components/StockVarianceAlert.jsx
│   │   ├── services/inventory.api.js
│   │   └── tests/inventory.test.jsx
│   ├── goodsCollection/
│   │   ├── components/GoodsSelector.jsx
│   │   ├── components/AllowanceSummary.jsx
│   │   ├── components/CollectionConfirmation.jsx
│   │   ├── services/goodsCollection.api.js
│   │   ├── validation/goodsCollection.schema.js
│   │   └── tests/goodsCollection.test.jsx
│   ├── transparency/
│   │   ├── components/TransparencySummary.jsx
│   │   ├── components/FundFlowChart.jsx
│   │   ├── components/GoodsDistributionChart.jsx
│   │   ├── services/transparency.api.js
│   │   └── tests/transparency.test.jsx
│   ├── recognitionTiers/
│   │   ├── components/TierBadge.jsx
│   │   ├── components/TierProgress.jsx
│   │   ├── components/RecognitionBoard.jsx
│   │   ├── services/recognition.api.js
│   │   └── tests/recognitionTiers.test.jsx
│   ├── forensicAnalytics/
│   │   ├── components/AnomalySummary.jsx
│   │   ├── components/InvestigationTimeline.jsx
│   │   ├── services/forensics.api.js
│   │   └── tests/forensicAnalytics.test.jsx
│   ├── auditTrail/
│   │   ├── components/AuditTimeline.jsx
│   │   ├── components/EvidenceVerifier.jsx
│   │   ├── services/audit.api.js
│   │   └── tests/auditTrail.test.jsx
│   ├── notifications/
│   │   ├── components/NotificationList.jsx
│   │   ├── components/NotificationPreferences.jsx
│   │   ├── services/notifications.api.js
│   │   └── tests/notifications.test.jsx
│   └── complaints/
│       ├── components/ComplaintForm.jsx
│       ├── components/AppealForm.jsx
│       ├── components/CaseStatus.jsx
│       ├── services/complaints.api.js
│       └── tests/complaints.test.jsx
├── components/
│   ├── common/Button.jsx
│   ├── common/Card.jsx
│   ├── common/Modal.jsx
│   ├── common/Pagination.jsx
│   ├── forms/FormField.jsx
│   ├── forms/SelectField.jsx
│   ├── forms/PhoneField.jsx
│   ├── tables/DataTable.jsx
│   ├── charts/MetricChart.jsx
│   ├── feedback/Alert.jsx
│   ├── feedback/LoadingState.jsx
│   ├── feedback/EmptyState.jsx
│   ├── feedback/ErrorState.jsx
│   ├── privacy/MaskedValue.jsx
│   └── status/StatusBadge.jsx
├── services/
│   ├── httpClient.js
│   ├── csrf.js
│   ├── requestId.js
│   ├── errorMapper.js
│   └── downloadClient.js
├── store/
│   ├── auth.store.js
│   ├── preferences.store.js
│   └── notification.store.js
├── hooks/
│   ├── useAsyncAction.js
│   ├── useDebounce.js
│   ├── usePagination.js
│   └── useDocumentTitle.js
├── validation/
│   ├── common.schema.js
│   └── phone.schema.js
├── utils/
│   ├── currency.js
│   ├── dates.js
│   ├── masking.js
│   ├── statuses.js
│   └── accessibility.js
└── tests/
    ├── setup.js
    ├── mocks/
    ├── fixtures/
    └── accessibility/
```

### 16.2 Expanded Backend Foundation

```text
backend/src/
├── server.js
├── app.js
├── config/
│   ├── environment.js
│   ├── database.js
│   ├── authentication.js
│   ├── security.js
│   ├── cors.js
│   ├── logging.js
│   ├── integrations.js
│   ├── blockchain.js
│   └── featureFlags.js
├── bootstrap/
│   ├── validateEnvironment.js
│   ├── connectDatabase.js
│   ├── registerMiddleware.js
│   ├── registerRoutes.js
│   ├── startWorkers.js
│   └── gracefulShutdown.js
├── routes/
│   ├── index.js
│   ├── public.routes.js
│   ├── authenticated.routes.js
│   ├── webhook.routes.js
│   └── health.routes.js
├── middleware/
│   ├── authenticate.js
│   ├── authorize.js
│   ├── requireMfa.js
│   ├── validateRequest.js
│   ├── csrfProtection.js
│   ├── rateLimit.js
│   ├── idempotency.js
│   ├── requestContext.js
│   ├── requestLogger.js
│   ├── auditContext.js
│   ├── notFound.js
│   └── errorHandler.js
├── errors/
│   ├── AppError.js
│   ├── AuthenticationError.js
│   ├── AuthorizationError.js
│   ├── ConflictError.js
│   ├── ValidationError.js
│   ├── IntegrationError.js
│   └── errorCodes.js
├── security/
│   ├── passwordHasher.js
│   ├── tokenHasher.js
│   ├── sessionProtector.js
│   ├── encryption.js
│   ├── keyVersions.js
│   ├── webhookVerifier.js
│   ├── replayProtector.js
│   ├── sensitiveDataRedactor.js
│   ├── secureIdentifier.js
│   └── securityEventRecorder.js
├── observability/
│   ├── logger.js
│   ├── metrics.js
│   ├── tracing.js
│   ├── healthChecks.js
│   └── requestCorrelation.js
├── events/
│   ├── eventBus.js
│   ├── eventNames.js
│   ├── eventPublisher.js
│   ├── eventHandlers.js
│   └── outboxProcessor.js
├── jobs/
│   ├── jobRunner.js
│   ├── jobRegistry.js
│   ├── paymentStatus.job.js
│   ├── reconciliation.job.js
│   ├── confirmationExpiry.job.js
│   ├── reservationExpiry.job.js
│   ├── blockchainAnchor.job.js
│   ├── ipfsAvailability.job.js
│   ├── anomalyScan.job.js
│   ├── tierRecalculation.job.js
│   ├── notificationDelivery.job.js
│   └── transparencyRefresh.job.js
├── utils/
│   ├── dates.js
│   ├── money.js
│   ├── canonicalJson.js
│   ├── pagination.js
│   ├── retry.js
│   └── assertions.js
└── constants/
    ├── roles.js
    ├── permissions.js
    ├── statuses.js
    └── integrationNames.js
```

### 16.3 Expanded Backend Domain Modules

Each module is self-contained. Its controller never calls Prisma or an external provider directly; controllers call services, services apply rules, and repositories/adapters perform I/O.

```text
backend/src/modules/
├── auth/
│   ├── auth.routes.js
│   ├── auth.controller.js
│   ├── auth.service.js
│   ├── auth.repository.js
│   ├── auth.validation.js
│   ├── auth.policy.js
│   ├── auth.mapper.js
│   ├── auth.events.js
│   ├── auth.errors.js
│   ├── passwordReset.service.js
│   ├── accountVerification.service.js
│   ├── mfa.service.js
│   └── auth.test.js
├── users/
│   ├── users.routes.js
│   ├── users.controller.js
│   ├── users.service.js
│   ├── users.repository.js
│   ├── users.validation.js
│   ├── users.policy.js
│   ├── users.mapper.js
│   ├── users.events.js
│   └── users.test.js
├── roles/
│   ├── roles.routes.js
│   ├── roles.controller.js
│   ├── roles.service.js
│   ├── roles.repository.js
│   ├── roles.validation.js
│   ├── roles.policy.js
│   ├── permissions.service.js
│   └── roles.test.js
├── sessions/
│   ├── sessions.routes.js
│   ├── sessions.controller.js
│   ├── sessions.service.js
│   ├── sessions.repository.js
│   ├── sessions.policy.js
│   ├── sessionRotation.service.js
│   ├── sessionRevocation.service.js
│   └── sessions.test.js
├── donors/
│   ├── donors.routes.js
│   ├── donors.controller.js
│   ├── donors.service.js
│   ├── donors.repository.js
│   ├── donors.validation.js
│   ├── donors.policy.js
│   ├── donors.mapper.js
│   ├── aliasGenerator.service.js
│   └── donors.test.js
├── publicProfiles/
│   ├── publicProfiles.routes.js
│   ├── publicProfiles.controller.js
│   ├── publicProfiles.service.js
│   ├── publicProfiles.repository.js
│   ├── publicProfiles.validation.js
│   ├── publicProfiles.policy.js
│   ├── publicProfile.mapper.js
│   └── publicProfiles.test.js
├── recognition/
│   ├── recognition.routes.js
│   ├── recognition.controller.js
│   ├── recognition.service.js
│   ├── recognition.repository.js
│   ├── recognition.validation.js
│   ├── tierCalculator.service.js
│   ├── goodsValuation.service.js
│   ├── recognition.events.js
│   └── recognition.test.js
├── moneyDonations/
│   ├── moneyDonations.routes.js
│   ├── moneyDonations.controller.js
│   ├── moneyDonations.service.js
│   ├── moneyDonations.repository.js
│   ├── moneyDonations.validation.js
│   ├── moneyDonations.policy.js
│   ├── moneyDonations.mapper.js
│   ├── donationTracking.service.js
│   ├── donationAllocation.service.js
│   ├── donationReceipt.service.js
│   ├── moneyDonations.events.js I would want us to work on the backend 
│   ├── moneyDonations.errors.js
│   └── moneyDonations.test.js
├── physicalDonations/
│   ├── physicalDonations.routes.js
│   ├── physicalDonations.controller.js
│   ├── physicalDonations.service.js
│   ├── physicalDonations.repository.js
│   ├── physicalDonations.validation.js
│   ├── physicalDonations.policy.js
│   ├── physicalDonations.mapper.js
│   ├── physicalDonationInspection.service.js
│   ├── physicalCashDeposit.service.js
│   ├── physicalDonations.events.js
│   └── physicalDonations.test.js
├── confirmations/
│   ├── confirmations.routes.js
│   ├── confirmations.controller.js
│   ├── confirmations.service.js
│   ├── confirmations.repository.js
│   ├── confirmations.validation.js
│   ├── confirmations.policy.js
│   ├── confirmationToken.service.js
│   ├── confirmationExpiry.service.js
│   ├── confirmations.events.js
│   └── confirmations.test.js
├── students/
│   ├── students.routes.js
│   ├── students.controller.js
│   ├── students.service.js
│   ├── students.repository.js
│   ├── students.validation.js
│   ├── students.policy.js
│   ├── students.mapper.js
│   └── students.test.js
├── universityRecords/
│   ├── universityRecords.routes.js
│   ├── universityRecords.controller.js
│   ├── universityRecords.service.js
│   ├── universityRecords.repository.js
│   ├── universityRecords.validation.js
│   ├── universityRecords.policy.js
│   ├── universityRecords.mapper.js
│   ├── paymentHistory.service.js
│   ├── examCalendar.service.js
│   ├── aidRecords.service.js
│   └── universityRecords.test.js
├── vetting/
│   ├── vetting.routes.js
│   ├── vetting.controller.js
│   ├── vetting.service.js
│   ├── vetting.repository.js
│   ├── vetting.validation.js
│   ├── vetting.policy.js
│   ├── vetting.mapper.js
│   ├── vettingPolicy.service.js
│   ├── microPaymentFactor.js
│   ├── examPeriodFactor.js
│   ├── financeBlockFactor.js
│   ├── aidRelianceFactor.js
│   ├── unmetBalanceFactor.js
│   ├── previousAssistanceFactor.js
│   ├── duplicateApplicationFactor.js
│   ├── vettingExplanation.service.js
│   ├── vetting.events.js
│   └── vetting.test.js
├── applications/
│   ├── applications.routes.js
│   ├── applications.controller.js
│   ├── applications.service.js
│   ├── applications.repository.js
│   ├── applications.validation.js
│   ├── applications.policy.js
│   ├── applications.mapper.js
│   ├── applicationStateMachine.js
│   ├── duplicatePrevention.service.js
│   ├── applications.events.js
│   └── applications.test.js
├── committee/
│   ├── committee.routes.js
│   ├── committee.controller.js
│   ├── committee.service.js
│   ├── committee.repository.js
│   ├── committee.validation.js
│   ├── committee.policy.js
│   ├── membership.service.js
│   ├── conflictOfInterest.service.js
│   └── committee.test.js
├── approvals/
│   ├── approvals.routes.js
│   ├── approvals.controller.js
│   ├── approvals.service.js
│   ├── approvals.repository.js
│   ├── approvals.validation.js
│   ├── approvals.policy.js
│   ├── approvals.mapper.js
│   ├── approvalDigest.service.js
│   ├── approvalThreshold.service.js
│   ├── approvalInvalidation.service.js
│   ├── approvals.events.js
│   ├── approvals.errors.js
│   └── approvals.test.js
├── disbursements/
│   ├── disbursements.routes.js
│   ├── disbursements.controller.js
│   ├── disbursements.service.js
│   ├── disbursements.repository.js
│   ├── disbursements.validation.js
│   ├── disbursements.policy.js
│   ├── disbursements.mapper.js
│   ├── tuitionDisbursement.service.js
│   ├── upkeepDisbursement.service.js
│   ├── disbursementStateMachine.js
│   ├── disbursements.events.js
│   └── disbursements.test.js
├── payments/
│   ├── payments.routes.js
│   ├── payments.controller.js
│   ├── payments.service.js
│   ├── payments.repository.js
│   ├── payments.validation.js
│   ├── payments.policy.js
│   ├── payments.mapper.js
│   ├── paymentProviderFactory.js
│   ├── paymentIdempotency.service.js
│   ├── providerEvent.service.js
│   ├── paymentStatus.service.js
│   ├── payments.events.js
│   └── payments.test.js
├── reconciliation/
│   ├── reconciliation.routes.js
│   ├── reconciliation.controller.js
│   ├── reconciliation.service.js
│   ├── reconciliation.repository.js
│   ├── reconciliation.validation.js
│   ├── reconciliation.policy.js
│   ├── transactionMatcher.service.js
│   ├── ledgerPosting.service.js
│   ├── varianceDetection.service.js
│   ├── reconciliation.events.js
│   └── reconciliation.test.js
├── inventory/
│   ├── inventory.routes.js
│   ├── inventory.controller.js
│   ├── inventory.service.js
│   ├── inventory.repository.js
│   ├── inventory.validation.js
│   ├── inventory.policy.js
│   ├── inventory.mapper.js
│   ├── stockMovement.service.js
│   ├── reservation.service.js
│   ├── inspection.service.js
│   ├── batchAndExpiry.service.js
│   ├── stockCount.service.js
│   ├── inventory.events.js
│   └── inventory.test.js
├── goodsCollections/
│   ├── goodsCollections.routes.js
│   ├── goodsCollections.controller.js
│   ├── goodsCollections.service.js
│   ├── goodsCollections.repository.js
│   ├── goodsCollections.validation.js
│   ├── goodsCollections.policy.js
│   ├── goodsCollections.mapper.js
│   ├── goodsEligibility.service.js
│   ├── collectionLimit.service.js
│   ├── collectionConfirmation.service.js
│   ├── goodsRelease.service.js
│   ├── goodsCollections.events.js
│   └── goodsCollections.test.js
├── evidence/
│   ├── evidence.routes.js
│   ├── evidence.controller.js
│   ├── evidence.service.js
│   ├── evidence.repository.js
│   ├── evidence.validation.js
│   ├── evidence.policy.js
│   ├── evidence.mapper.js
│   ├── canonicalEvidence.service.js
│   ├── evidenceEncryption.service.js
│   ├── evidenceRetention.service.js
│   └── evidence.test.js
├── blockchainAudit/
│   ├── blockchainAudit.routes.js
│   ├── blockchainAudit.controller.js
│   ├── blockchainAudit.service.js
│   ├── blockchainAudit.repository.js
│   ├── blockchainAudit.validation.js
│   ├── blockchainAudit.policy.js
│   ├── commitmentBuilder.service.js
│   ├── anchorQueue.service.js
│   ├── transactionMonitor.service.js
│   └── blockchainAudit.test.js
├── forensicAnalytics/
│   ├── forensicAnalytics.routes.js
│   ├── forensicAnalytics.controller.js
│   ├── forensicAnalytics.service.js
│   ├── forensicAnalytics.repository.js
│   ├── forensicAnalytics.validation.js
│   ├── forensicAnalytics.policy.js
│   ├── rules/unreconciledMoney.rule.js
│   ├── rules/duplicateCallback.rule.js
│   ├── rules/repeatedConfirmationFailure.rule.js
│   ├── rules/unusualClerkActivity.rule.js
│   ├── rules/inventoryVariance.rule.js
│   ├── rules/disbursementSpike.rule.js
│   ├── rules/approvalConflict.rule.js
│   ├── investigation.service.js
│   └── forensicAnalytics.test.js
├── auditLogs/
│   ├── auditLogs.routes.js
│   ├── auditLogs.controller.js
│   ├── auditLogs.service.js
│   ├── auditLogs.repository.js
│   ├── auditLogs.policy.js
│   ├── auditEventBuilder.js
│   ├── auditIntegrity.service.js
│   └── auditLogs.test.js
├── notifications/
│   ├── notifications.routes.js
│   ├── notifications.controller.js
│   ├── notifications.service.js
│   ├── notifications.repository.js
│   ├── notifications.validation.js
│   ├── notifications.policy.js
│   ├── notificationTemplate.service.js
│   ├── notificationDelivery.service.js
│   └── notifications.test.js
├── complaints/
│   ├── complaints.routes.js
│   ├── complaints.controller.js
│   ├── complaints.service.js
│   ├── complaints.repository.js
│   ├── complaints.validation.js
│   ├── complaints.policy.js
│   ├── appeals.service.js
│   ├── complaints.events.js
│   └── complaints.test.js
├── reports/
│   ├── reports.routes.js
│   ├── reports.controller.js
│   ├── reports.service.js
│   ├── reports.repository.js
│   ├── reports.policy.js
│   ├── quarterlyReport.service.js
│   ├── donorStatement.service.js
│   └── reports.test.js
├── transparency/
│   ├── transparency.routes.js
│   ├── transparency.controller.js
│   ├── transparency.service.js
│   ├── transparency.repository.js
│   ├── transparency.policy.js
│   ├── publicDataSanitizer.js
│   ├── transparencyAggregation.service.js
│   └── transparency.test.js
├── policies/
│   ├── policies.routes.js
│   ├── policies.controller.js
│   ├── policies.service.js
│   ├── policies.repository.js
│   ├── policies.validation.js
│   ├── policies.policy.js
│   ├── policyVersioning.service.js
│   └── policies.test.js
└── systemHealth/
    ├── systemHealth.routes.js
    ├── systemHealth.controller.js
    ├── systemHealth.service.js
    ├── dependencyChecks.service.js
    ├── readiness.service.js
    └── systemHealth.test.js
```

### 16.4 Expanded Backend Integrations

```text
backend/src/integrations/
├── mpesa/
│   ├── mpesa.config.js
│   ├── mpesa.client.js
│   ├── mpesa.auth.js
│   ├── mpesa.mapper.js
│   ├── stkPush.adapter.js
│   ├── c2b.adapter.js
│   ├── b2c.adapter.js
│   ├── b2b.adapter.js
│   ├── transactionStatus.adapter.js
│   ├── reconciliation.adapter.js
│   ├── callback.controller.js
│   ├── callback.validation.js
│   ├── callbackDeduplicator.js
│   ├── mpesa.errors.js
│   └── mpesa.test.js
├── bank/
│   ├── bankProvider.interface.js
│   ├── bankProviderFactory.js
│   ├── bankWebhook.controller.js
│   ├── bankWebhook.validation.js
│   ├── bankReconciliation.adapter.js
│   ├── sandboxBank.adapter.js
│   ├── bank.errors.js
│   └── bank.test.js
├── sms/
│   ├── smsProvider.interface.js
│   ├── smsProviderFactory.js
│   ├── sms.client.js
│   ├── smsTemplates.js
│   ├── confirmationMessage.builder.js
│   ├── deliveryStatus.controller.js
│   ├── deliveryStatus.validation.js
│   ├── sandboxSms.adapter.js
│   ├── sms.errors.js
│   └── sms.test.js
├── ipfs/
│   ├── ipfs.config.js
│   ├── ipfs.client.js
│   ├── ipfsUploader.js
│   ├── ipfsRetriever.js
│   ├── ipfsPinner.js
│   ├── cidVerifier.js
│   ├── contentEncryption.js
│   ├── availabilityChecker.js
│   ├── ipfs.errors.js
│   └── ipfs.test.js
├── blockchain/
│   ├── web3.config.js
│   ├── web3.client.js
│   ├── contractRegistry.js
│   ├── transactionSigner.js
│   ├── transactionSubmitter.js
│   ├── transactionReceipt.js
│   ├── eventReader.js
│   ├── confirmationMonitor.js
│   ├── blockchain.errors.js
│   └── blockchain.test.js
└── chainlink/
    ├── chainlink.config.js
    ├── chainlink.client.js
    ├── oracleRequest.adapter.js
    ├── oracleResult.validator.js
    └── chainlink.test.js
```

### 16.5 Expanded Database and Migrations

```text
database/
├── package.json
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   │   ├── 0001_identity_and_access/
│   │   │   └── migration.sql
│   │   ├── 0002_donors_and_public_profiles/
│   │   │   └── migration.sql
│   │   ├── 0003_money_donations_and_payments/
│   │   │   └── migration.sql
│   │   ├── 0004_physical_donations_and_confirmations/
│   │   │   └── migration.sql
│   │   ├── 0005_inventory_and_stock_movements/
│   │   │   └── migration.sql
│   │   ├── 0006_students_and_university_records/
│   │   │   └── migration.sql
│   │   ├── 0007_vetting_policies_and_results/
│   │   │   └── migration.sql
│   │   ├── 0008_applications_and_committee_approvals/
│   │   │   └── migration.sql
│   │   ├── 0009_disbursements_and_reconciliation/
│   │   │   └── migration.sql
│   │   ├── 0010_goods_collections/
│   │   │   └── migration.sql
│   │   ├── 0011_evidence_blockchain_and_audit/
│   │   │   └── migration.sql
│   │   ├── 0012_forensics_complaints_and_notifications/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── seed.js
├── client/
│   ├── prismaClient.js
│   ├── transaction.js
│   └── databaseHealth.js
├── seeds/
│   ├── index.js
│   ├── roles.seed.js
│   ├── permissions.seed.js
│   ├── policies.seed.js
│   ├── recognitionTiers.seed.js
│   ├── goodsCatalog.seed.js
│   ├── committee.seed.js
│   └── mockUniversity.seed.js
├── fixtures/
│   ├── users.fixture.js
│   ├── students.fixture.js
│   ├── donations.fixture.js
│   ├── inventory.fixture.js
│   └── payments.fixture.js
├── views/
│   ├── public_transparency.sql
│   ├── available_inventory.sql
│   ├── financial_reconciliation.sql
│   └── assistance_outcomes.sql
├── functions/
│   ├── ledger_balance_check.sql
│   ├── inventory_balance_check.sql
│   └── immutable_audit_guard.sql
├── scripts/
│   ├── migrate.js
│   ├── seed.js
│   ├── resetTestDatabase.js
│   ├── backup.js
│   ├── restore.js
│   └── verifyConstraints.js
└── tests/
    ├── migrations.test.js
    ├── constraints.test.js
    ├── seeds.test.js
    ├── ledger.test.js
    └── inventory.test.js
```

Migration names above describe the intended sequence; Prisma will generate timestamped directory names during implementation. Production migrations are never rewritten after application.

### 16.6 Expanded Blockchain Package

```text
blockchain/
├── package.json
├── hardhat.config.js
├── .env.example
├── contracts/
│   ├── CharityChainAccess.sol
│   ├── DonationAuditRegistry.sol
│   ├── ApplicationAuditRegistry.sol
│   ├── ApprovalAuditRegistry.sol
│   ├── DisbursementAuditRegistry.sol
│   ├── InventoryAuditRegistry.sol
│   ├── EvidenceRegistry.sol
│   ├── interfaces/
│   │   ├── ICharityChainAccess.sol
│   │   ├── IDonationAuditRegistry.sol
│   │   ├── IApplicationAuditRegistry.sol
│   │   ├── IApprovalAuditRegistry.sol
│   │   ├── IDisbursementAuditRegistry.sol
│   │   ├── IInventoryAuditRegistry.sol
│   │   └── IEvidenceRegistry.sol
│   └── libraries/
│       ├── CommitmentTypes.sol
│       ├── AuditErrors.sol
│       └── RecordVersions.sol
├── scripts/
│   ├── deploy.js
│   ├── verify.js
│   ├── grantRoles.js
│   ├── revokeRoles.js
│   ├── pauseContracts.js
│   ├── unpauseContracts.js
│   ├── exportAbis.js
│   └── validateDeployment.js
├── deployment/
│   ├── deploymentConfig.js
│   ├── deploymentOrder.js
│   └── addressBook.js
├── deployments/
│   ├── localhost/addresses.json
│   ├── polygon-amoy/addresses.json
│   └── polygon-mainnet/addresses.json
├── test/
│   ├── unit/CharityChainAccess.test.js
│   ├── unit/DonationAuditRegistry.test.js
│   ├── unit/ApplicationAuditRegistry.test.js
│   ├── unit/ApprovalAuditRegistry.test.js
│   ├── unit/DisbursementAuditRegistry.test.js
│   ├── unit/InventoryAuditRegistry.test.js
│   ├── unit/EvidenceRegistry.test.js
│   ├── integration/auditFlow.test.js
│   ├── invariants/noDuplicateCommitment.test.js
│   ├── invariants/noUnauthorizedWriter.test.js
│   └── fixtures/deployFixture.js
├── abi/
│   └── generated contract ABI files
└── coverage/
```

### 16.7 Expanded Shared Package

```text
shared/src/
├── constants/
│   ├── roles.js
│   ├── permissions.js
│   ├── limits.js
│   └── integrationNames.js
├── enums/
│   ├── donationStatus.js
│   ├── confirmationStatus.js
│   ├── applicationStatus.js
│   ├── approvalStatus.js
│   ├── disbursementStatus.js
│   ├── inventoryStatus.js
│   ├── collectionStatus.js
│   └── anomalyStatus.js
├── validation/
│   ├── identifiers.schema.js
│   ├── pagination.schema.js
│   ├── money.schema.js
│   └── phone.schema.js
├── permissions/
│   ├── rolePermissions.js
│   └── permissionNames.js
├── statusMachines/
│   ├── donation.machine.js
│   ├── physicalDonation.machine.js
│   ├── application.machine.js
│   ├── disbursement.machine.js
│   ├── collection.machine.js
│   └── anomaly.machine.js
├── eventSchemas/
│   ├── donation.events.js
│   ├── application.events.js
│   ├── approval.events.js
│   ├── disbursement.events.js
│   └── inventory.events.js
├── apiContracts/
│   ├── auth.contracts.js
│   ├── donations.contracts.js
│   ├── applications.contracts.js
│   ├── inventory.contracts.js
│   └── transparency.contracts.js
└── utils/
    ├── publicFields.js
    └── errorCodes.js
```

### 16.8 Expanded Simulators and Cross-System Tests

```text
simulators/
├── mpesa-simulator/
│   ├── server.js
│   ├── scenarios.js
│   ├── callbacks.js
│   └── fixtures/
├── sms-simulator/
│   ├── server.js
│   ├── inbox.js
│   ├── deliveryReports.js
│   └── fixtures/
├── bank-simulator/
│   ├── server.js
│   ├── settlements.js
│   ├── webhooks.js
│   └── fixtures/
└── blockchain-simulator/
    ├── localNode.js
    ├── deployments.js
    └── scenarios.js

tests/
├── e2e/
│   ├── donorMoneyFlow/
│   │   ├── successfulDonation.test.js
│   │   ├── failedDonation.test.js
│   │   ├── duplicateCallback.test.js
│   │   └── reversal.test.js
│   ├── physicalDonationFlow/
│   │   ├── donorConfirms.test.js
│   │   ├── donorRejects.test.js
│   │   ├── confirmationExpires.test.js
│   │   └── cashDepositReconciliation.test.js
│   ├── studentVettingFlow/
│   │   ├── eligibleStudent.test.js
│   │   ├── duplicateApplication.test.js
│   │   └── recordDiscrepancy.test.js
│   ├── committeeApprovalFlow/
│   │   ├── twoDistinctApprovals.test.js
│   │   ├── duplicateApproverRejected.test.js
│   │   └── changedApplicationInvalidatesApproval.test.js
│   ├── fiatDisbursementFlow/
│   │   ├── tuitionPayment.test.js
│   │   ├── upkeepPayment.test.js
│   │   ├── failedPayout.test.js
│   │   └── reconciliation.test.js
│   ├── goodsCollectionFlow/
│   │   ├── collectionConfirmed.test.js
│   │   ├── collectionRejected.test.js
│   │   ├── limitsEnforced.test.js
│   │   └── inventoryNeverNegative.test.js
│   └── publicTransparencyFlow/
│       ├── aliasDisplayed.test.js
│       ├── realNameConsent.test.js
│       ├── donorOptOut.test.js
│       └── privateDataNotExposed.test.js
├── acceptance/
│   ├── donor.acceptance.test.js
│   ├── student.acceptance.test.js
│   ├── clerk.acceptance.test.js
│   ├── committee.acceptance.test.js
│   ├── finance.acceptance.test.js
│   └── auditor.acceptance.test.js
├── performance/
│   ├── apiLoad.test.js
│   ├── dashboardQueries.test.js
│   └── reconciliationBatch.test.js
├── resilience/
│   ├── mpesaUnavailable.test.js
│   ├── smsDelayed.test.js
│   ├── ipfsUnavailable.test.js
│   ├── blockchainRpcUnavailable.test.js
│   └── workerRestart.test.js
├── privacy/
│   ├── publicApiLeakage.test.js
│   ├── logsRedaction.test.js
│   ├── ipfsEncryption.test.js
│   └── blockchainPii.test.js
└── test-data/
    ├── builders/
    ├── fixtures/
    └── cleanup.js
```

### 16.9 Expanded Infrastructure, Automation, and Documentation

```text
infrastructure/
├── docker/
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   ├── simulator.Dockerfile
│   └── entrypoint.ps1
├── nginx/
│   ├── nginx.conf
│   └── security-headers.conf
├── environments/
│   ├── development/config.example.env
│   ├── test/config.example.env
│   ├── staging/config.example.env
│   └── production/config.example.env
├── monitoring/
│   ├── alerts.yml
│   ├── dashboards/
│   └── healthchecks.yml
├── backups/
│   ├── backup-policy.md
│   ├── restore-procedure.md
│   └── verification-checklist.md
└── runbooks/
    ├── mpesa-outage.md
    ├── sms-outage.md
    ├── database-recovery.md
    ├── compromised-account.md
    ├── compromised-service-key.md
    ├── reconciliation-variance.md
    └── inventory-variance.md

scripts/
├── setup.js
├── dev.js
├── test.js
├── lint.js
├── build.js
├── deploy.js
├── migrate.js
├── seed.js
├── rotateSecrets.js
├── verifyEnvironment.js
└── verifyRelease.js

documentation/
├── system dashboards.md
├── project structure.md
├── requirements/
│   ├── functional-requirements.md
│   ├── non-functional-requirements.md
│   └── acceptance-criteria.md
├── architecture/
│   ├── system-context.md
│   ├── containers.md
│   ├── money-flow.md
│   ├── goods-flow.md
│   └── trust-boundaries.md
├── api/
│   ├── endpoints.md
│   ├── authentication.md
│   ├── webhooks.md
│   └── error-codes.md
├── database/
│   ├── data-model.md
│   ├── migrations.md
│   ├── ledger.md
│   └── retention.md
├── blockchain/
│   ├── contracts.md
│   ├── deployments.md
│   └── audit-anchoring.md
├── security/
│   ├── threat-model.md
│   ├── access-control.md
│   ├── secrets.md
│   ├── privacy.md
│   └── incident-response.md
├── testing/
│   ├── strategy.md
│   ├── test-cases.md
│   └── traceability-matrix.md
├── deployment/
│   ├── environments.md
│   ├── deployment-guide.md
│   └── rollback.md
├── operations/
│   ├── reconciliation.md
│   ├── monitoring.md
│   └── backup-and-restore.md
├── user-guides/
│   ├── donor.md
│   ├── student.md
│   ├── clerk.md
│   ├── committee.md
│   ├── finance.md
│   ├── auditor.md
│   └── administrator.md
└── decisions/
    └── architecture decision records
```

## 17. Implementation Boundaries

This document proposes the eventual repository. At the current planning stage, only this Markdown document is created. The root folders and implementation files shown in the tree must be created only after the structure, naming, technologies, and delivery sequence are approved.
