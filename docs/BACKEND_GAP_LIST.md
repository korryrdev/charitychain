# Backend Gap List (backend vs `fullPRD.md`)

Source of truth is `docs/fullPRD.md`.
Tracks: **A** blockchain, **B** backend core, **C** forensics and integrity.

---

## P0. Foundations

- [x] **G01. Lock the chain interface** (A, M). D1, D5, D6, section 9.
  Implemented `DonationLedger.sol`, `CaseWorkflow.sol`, `PeriodAnchor.sol`, `SignatoryRegistry.sol` and compiled with Solc 0.8.28. ABIs saved in `shared/abis/`. Tested in `blockchain/test/unit/CoreContracts.test.js`.
- [x] **G02. Roles and permission matrix** (B, M). Section 4.2, FR-AUTH-01, FR-AUTH-03.
  Configured `SUBGROUP_REP, COMMITTEE_MEMBER, TREASURER, SIGNATORY, PHARMACY_CUSTODIAN, MEMBER_AUDITOR, SYSTEM_ADMIN` in `constants/roles.js` and `constants/permissions.js`. Required 2FA for committee, treasurer, signatory. System admin cannot approve money. Tested in `backend/tests/unit/rolesAndPermissions.test.js`.
- [x] **G03. Money as integer minor units** (B, M). Section 10.1 conventions.
  Implemented `utils/money.js` with BigInt minor units math. PRD entities use integer minor units (`requestedAmountMinor`, `totalAmountMinor`, etc.). Tested in `backend/tests/unit/utilities.test.js`.
- [x] **G04. Implement the stub utilities** (B, S).
  Implemented `canonicalJson.js`, `money.js`, `pagination.js`, `dates.js`, `retry.js`, `assertions.js` (including segregation of duties). Tested in `backend/tests/unit/utilities.test.js`.
- [x] **G05. Schema for PRD entities** (B, L). Section 10.1.
  Added PRD entities to Prisma schema and applied migration `20261110230000_prd_entities_and_triggers`. Added PostgreSQL triggers preventing UPDATE and DELETE on `case_events`, `allocations`, and `donation_raw_callbacks`. Tested in `backend/tests/integration/prdEntitiesAndTriggers.test.js`.
- [x] **G06. Donor reference model** (B, M). D9, FR-DON-01, FR-DON-02.
  Implemented keyed-hash donor references in `backend/src/security/donorReference.js`. Default `ANONYMOUS`, no account needed. Tested in `backend/tests/unit/donorReference.test.js`.

---

## P1. Phase 1 MVP (the graded core)

### Donation intake
- [x] **G07. Daraja C2B endpoints** (B, M). FR-INT-01 to 04.
  `POST /api/v1/daraja/c2b/validation/:token` and `/confirmation/:token`, tokenized path, immutable raw callback intake, idempotent on M-Pesa transaction ID. Tested in `backend/tests/unit/daraja.test.js`.
- [x] **G08. Receipt codes and earmarks** (B, S). FR-INT-10, FR-INT-11.
  Implemented `MLK-XXXX-XXXX` generator/validator in `utils/receiptCode.js`. Earmark mapping from donation purposes. Tested in `backend/tests/unit/daraja.test.js`.
- [x] **G09. Bank deposit entry and maker-checker** (B, M). FR-INT-06, FR-DON-03, R04.
  `POST /donations/bank`, `POST /donations/bank/:id/verify`. Maker-checker segregated (`assertSegregation`), consent version recorded, lot provisioned on verification. Tested in `backend/tests/unit/bankDeposit.test.js`.
- [x] **G10. In-kind item log and issue** (B, M). FR-INT-08, FR-FLOW-05.
  `POST /donations/items` (creates `IN_KIND` lot in `ITM` currency), `POST /inventory/issue` to case with stock enforcement. Tested in `backend/tests/unit/items.test.js`.

### Lots and fund flow
- [x] **G11. Lot model and FIFO allocation** (B, L). D4, FR-FLOW-01, FR-FLOW-02, FR-FLOW-04.
  FIFO lot consumption in `lots.service.js`, matching earmarks first, recording allocation rows. Tested in `backend/tests/unit/lotsAndFifo.test.js`.
- [x] **G12. Nightly pool-drift check** (C, S). FR-FLOW-03, R16.
  Verifies `remaining === inflow - allocated`, raises critical forensic alert if drift detected. Tested in `backend/tests/unit/lotsAndFifo.test.js`.

### Cases and approvals
- [x] **G13. Sub-groups, cases and state machine** (B, L). FR-CASE-01, 02, 08, 09, section 10.2.
  `POST /cases`, `GET /cases`, `GET /cases/:id`, `POST /cases/:id/submit`. Validates strict transitions, off-chain AES-256 encrypted PII, append-only `case_events`. Tested in `backend/tests/unit/casesWorkflow.test.js`.
- [x] **G14. Committee decision** (B, M). FR-CASE-03, FR-CASE-04, R03.
  `POST /cases/:id/decision` (approve, reject, needs_info). Blocks self-approval. Tested in `backend/tests/unit/casesWorkflow.test.js`.
- [x] **G15. Signatory wallets and 2-of-3 release** (B+A, L). D5, FR-AUTH-02, FR-CASE-05.
  `POST /cases/:id/authorize` collects EIP-712 signatory signatures and enforces 2 distinct registered signatories. Tested in `backend/tests/unit/casesWorkflow.test.js`.
- [x] **G16. Disbursement with evidence** (B, M). FR-CASE-06, FR-CASE-07, R01, R02.
  `POST /cases/:id/disburse` validates actual amount <= authorized ceiling, method, reference, and evidence CID. Consumes lots via FIFO. Tested in `backend/tests/unit/casesWorkflow.test.js`.

### Chain and evidence
- [x] **G17. Outbox writes to the PRD contracts** (B+A, M). D6, FR-CASE-08.
  Transactional outbox queues `donation.recorded`, `case.transitioned`, `case.authorized`, `case.disbursed`, `report.anchored` for smart contract anchoring with unique idempotency keys.
- [x] **G18. Encrypted evidence on IPFS** (B, S). D8.
  CID plus plaintext SHA-256 digest recorded; public files skip encryption; attached to donations and disbursements. Tested in `backend/tests/unit/evidenceCryptography.test.js`.

### Public views
- [x] **G19. Public trace** (B, M). FR-TRACE-01, 02, 05.
  `GET /public/trace/:receipt` returns lot status, FIFO allocation lines, case numbers, block/tx data. Tested in `backend/tests/unit/transparency.test.js`.
- [x] **G20. Public stats** (B, S). FR-TRACE-04.
  `GET /public/stats` returns total inflow, total outflow, active pool balance, beneficiaries helped, and category breakdowns without exposing PII. Tested in `backend/tests/unit/transparency.test.js`.

### Reports
- [x] **G21. Quarterly reports** (B, L). FR-REP-01 to 04.
  `POST /reports/quarterly`, `GET /reports/:id`, `GET /public/reports`. Deterministic canonical JSON and SHA-256 digest anchored to `PeriodAnchor`. Tested in `backend/src/modules/reports/reports.service.js`.

### Forensics and audit
- [x] **G22. Phase 1 rules and alert inbox** (C, L). FR-FOR-01 to 03, section 12.
  Rule engine runs R01-R20. `GET /alerts`, `GET /alerts/:id`, `POST /alerts/:id/resolve` (persists resolution notes, append-only history). Tested in `backend/tests/unit/forensicAnalytics.test.js`.
- [x] **G23. Audit access** (C, S). FR-AUD-01, FR-AUD-04.
  `GET /audit` read-only access for all authenticated users including system admins.
- [x] **G24. Auth and admin gaps** (B, M). FR-AUTH-03, FR-AUTH-04.
  `POST /users`, `PATCH /users/:id/roles` (admin only, logged to audit events and outbox), 2FA enforced for privileged roles.

---

## P2. Phase 2 (strong version)

- [x] **G25. Daily ledger digest** (C+A, M). FR-AUD-02, FR-AUD-03, R17.
  Daily Merkle root computed over audit log entries, `GET /public/digest/:day`, `GET /public/digest/:day/proof/:eventId`, anchors on-chain via `PeriodAnchor.anchorDaily`, raises R17 on root mismatch. Tested in `backend/tests/unit/dailyDigest.test.js`.
- [x] **G26. Bank statement CSV import and reconciliation** (B, M). FR-INT-07, R07.
  `POST /donations/bank/statements/import`, `GET /donations/bank/reconciliation`, 2-way matching between bank statement lines and ledger deposits, flags unmatched lines and raises R07. Tested in `backend/tests/unit/bankReconciliation.test.js`.
- [x] **G27. Foreign currency** (B, S). FR-INT-09.
  Stores original amount, currency, FX rate, and converts to KES minor units when provisioning lots. Tested in `backend/tests/unit/bankReconciliation.test.js`.
- [x] **G28. Rules table, tuning and fund flow graph** (C, L). FR-FOR-04, FR-FOR-05.
  `GET /alerts/rules`, `PATCH /alerts/rules/:id` within safe bounds, `GET /alerts/graph` fund flow DAG, Benford's law digit anomaly check (R14). Tested in `backend/tests/unit/phase2Features.test.js`.
- [x] **G29. Donor claim and display choices** (B, L). FR-DON-03 to 06, FR-DON-11.
  `POST /public/donor/claim`, `GET /public/donor/me`, `PATCH /public/donor/preferences`. Automatic name screening against English and Swahili blocklist, reserved words, and leetspeak lookalikes. Append-only preference events. Tested in `backend/tests/unit/phase2Features.test.js`.
- [x] **G30. Badges** (B, L). FR-DON-07 to 10, R19, R20.
  Bronze, Silver, Gold, Patron, and Consistent Giver badges. Tier threshold proposal with 7-day cooling period. Recomputes badges and audits awards. Tested in `backend/tests/unit/phase2Features.test.js`.
- [x] **G31. Recognition wall and moderation** (B, M). FR-DON-12, 15, 16.
  `GET /public/recognition` with k-anonymity (anonymous count shown only when >= 5), `POST /public/recognition/:id/report`, `POST /recognition/names/:id/takedown` (reason required, logged), masked name reveal. Tested in `backend/tests/unit/phase2Features.test.js`.
- [x] **G32. Donor receipt by SMS or email** (B, S).
  SMS receipt notifications dispatched via `donorReceiptNotification.service.js` with trace URL.
- [x] **G33. Fraud simulator** (C, L). Section 12.4.
  `backend/src/simulator/fraudSimulator.js` generates 1 year of synthetic activity with 10 labelled scenarios and evaluates rule precision, recall, and F1 scores. Tested in `backend/tests/unit/phase2Features.test.js`.

---

## P3. Stretch

- [x] **G34. Public read-only auditor API** (FR-AUD-01, FR-AUD-04).
  `GET /public/audit/export` allows downloading paginated audit logs with sequences and previous hashes for independent verification. Tested in `backend/tests/unit/phase3Features.test.js`.
- [x] **G35. Testnet stablecoin channel**.
  `POST /public/crypto/stablecoin` records verified USDC/USDT transactions, computes KES minor units, provisions lot, and queues on-chain anchor. Tested in `backend/tests/unit/phase3Features.test.js`.
- [x] **G36. Backend support for browser Merkle proof verify and Chainlink Automation**.
  `POST /public/verify-proof` verifies Merkle inclusion proofs. `GET /public/chainlink/automation` evaluates daily digest anchoring and pool drift status. Tested in `backend/tests/unit/phase3Features.test.js`.
- [x] **G37. Donor thank-you certificate (FR-DON-14)**.
  `GET /public/certificate/:receipt` generates cryptographic SVG certificate of appreciation containing receipt code, donor display name, impact details, and SHA-256 verification signature. Tested in `backend/tests/unit/phase3Features.test.js`.
