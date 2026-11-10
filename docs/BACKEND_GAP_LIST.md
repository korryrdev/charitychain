# Backend Gap List (backend vs `fullPRD.md`)

Source of truth is `docs/fullPRD.md`. Work top to bottom: later items depend on earlier ones.
Tick a box only when the code is merged and a test references the FR ID (PRD section 17).
Tracks: **A** blockchain, **B** backend core, **C** forensics and integrity. Size is a rough guide: S under a day, M 1 to 2 days, L 3 days or more.

**State of the backend today:** Express 5 + Better Auth, builds clean, 41 unit tests pass. It implements a student application, vetting and bursary flow that is not in the PRD. 52 files are empty stubs (whole `reports/` module, `policies/`, `complaints/`, and utils such as `money.js` and `canonicalJson.js`).

---

## P0. Foundations (everything else depends on these)

- [ ] **G01. Lock the chain interface** (A, M). D1, D5, D6, section 9.
  Now: `blockchain/contracts` has `*AuditRegistry` contracts for the old flow.
  Do: agree on `DonationLedger`, `CaseWorkflow`, `PeriodAnchor`, `SignatoryRegistry` and their ABIs, so backend chain writes (G17) have a target.
- [ ] **G02. Roles and permission matrix** (B, M). Section 4.2, FR-AUTH-01, FR-AUTH-03.
  Now: `DONOR, STUDENT, CLERK, INVENTORY_SUPERVISOR, COMMITTEE_MEMBER, FINANCE_OPERATOR, AUDITOR, ADMINISTRATOR`.
  Do: `SUBGROUP_REP, COMMITTEE_MEMBER, TREASURER, SIGNATORY, PHARMACY_CUSTODIAN, MEMBER_AUDITOR, SYSTEM_ADMIN` (donors have no account). Update `constants/roles.js`, `permissions.js`, seeds. Require 2FA for committee, treasurer, signatory. System admin cannot approve money or edit records.
- [ ] **G03. Money as integer minor units** (B, M). Section 10.1 conventions.
  Now: `Decimal(18,2)` everywhere.
  Do: store amounts as integer minor units, implement `utils/money.js`, migrate columns. Cheaper now than later.
- [ ] **G04. Implement the stub utilities** (B, S). `canonicalJson.js` (needed for deterministic reports and hashing, FR-REP-02), `money.js`, `pagination.js` (cursor), `dates.js` (UTC), `retry.js`, `assertions.js`.
- [ ] **G05. Schema for PRD entities** (B, L). Section 10.1.
  Add: `subgroups, cases, case_events, approvals, lots, allocations, bank_deposits, bank_statement_lines, donation_raw_callbacks, chain_txs, anchors, reports, alerts, alert_events, rules, donor_preference_events, badge_tiers, donor_badges, donor_period_totals`. Adapt `inventory` for item movements.
  Add DB triggers blocking UPDATE and DELETE on `case_events`, `allocations`, `donation_raw_callbacks` (only `audit_logs` has one today).
- [ ] **G06. Donor reference model** (B, M). D9, FR-DON-01, FR-DON-02.
  Now: `DonorProfile` requires a `userId`, defaults to `ALIAS` and `publicListed = true`, and has a committee alias review step.
  Do: keyed-hash donor reference (phone, bank ref or email), no account needed, default `ANONYMOUS`, no committee pre-approval (automatic screening instead, see G29).

---

## P1. Phase 1 MVP (the graded core)

### Donation intake
- [ ] **G07. Daraja C2B endpoints** (B, M). FR-INT-01 to 04.
  Now: M-Pesa adapters exist, callbacks go through `/webhooks/payments/:provider`, only `payloadDigest` is kept.
  Do: `POST /api/v1/daraja/c2b/validation/:token` and `/confirmation/:token`, secret path token plus Safaricom IP allowlist, store the raw callback immutably before parsing, idempotent on M-Pesa transaction ID.
- [ ] **G08. Receipt codes and earmarks** (B, S). FR-INT-10, FR-INT-11.
  Now: `MRC-XXXXXXXX`.
  Do: `MLK-XXXX-XXXX` format, M-Pesa receipt code also accepted for lookup, optional category earmark mapped from `DonationPurpose`.
- [ ] **G09. Bank deposit entry and maker-checker** (B, M). FR-INT-06, FR-DON-03, R04.
  Do: `POST /donations/bank`, `POST /donations/bank/:id/verify`. Verifier must differ from entrant, enforced in code. Record consent text version. Deposit counts only after verification.
- [ ] **G10. In-kind item log and issue** (B, M). FR-INT-08, FR-FLOW-05.
  Now: physical donations need a donor confirmation round trip.
  Do: `POST /donations/items` (category, quantity, condition, optional value, photo, donor label) that works on a phone with a poor connection. `POST /inventory/issue` to a case with a running stock count.

### Lots and fund flow
- [ ] **G11. Lot model and FIFO allocation** (B, L). D4, FR-FLOW-01, FR-FLOW-02, FR-FLOW-04.
  Now: a `DonationAllocation` table exists, no lot or FIFO logic.
  Do: each verified donation creates a lot with remaining balance. Disbursements consume lots FIFO, respecting earmarks, and store each allocation line.
- [ ] **G12. Nightly pool-drift check** (C, S). FR-FLOW-03, R16.
  Do: lots remaining must equal verified inflow minus disbursed outflow, otherwise raise a critical alert.

### Cases and approvals
- [ ] **G13. Sub-groups, cases and state machine** (B, L). FR-CASE-01, 02, 08, 09, section 10.2.
  Do: `POST /cases`, `GET /cases`, `GET /cases/:id`, `POST /cases/:id/submit`. States `DRAFT → SUBMITTED → UNDER_REVIEW → NEEDS_INFO / APPROVED / REJECTED → AUTHORIZED → DISBURSED → CLOSED`. Reject illegal transitions. Append-only `case_events`. Student identity encrypted off-chain (`security/encryption.js`). Public views show a pseudonymous case ID only.
- [ ] **G14. Committee decision** (B, M). FR-CASE-03, FR-CASE-04, R03.
  Do: `POST /cases/:id/decision` (approve, reject, ask for info). Approver must differ from submitter, enforced in code. Reuse the `approvals` and `committee` modules where they fit.
- [ ] **G15. Signatory wallets and 2-of-3 release** (B+A, L). D5, FR-AUTH-02, FR-CASE-05.
  Do: `POST /auth/wallet/challenge`, `/auth/wallet/link`. `POST /cases/:id/authorize` collects EIP-712 signatures and verifies two distinct registered signatories. A signatory cannot be the only approver of their own disbursement. Registering a signatory on-chain needs two signatories.
- [ ] **G16. Disbursement with evidence** (B, M). FR-CASE-06, FR-CASE-07, R01, R02.
  Now: disbursement module is a provider-driven B2C payout (tuition, upkeep).
  Do: `POST /cases/:id/disburse` with actual amount, method (M-Pesa, bank, cash, direct to institution, items), reference and evidence. Block anything above the authorized amount. Allocate against lots (G11).

### Chain and evidence
- [ ] **G17. Outbox writes to the PRD contracts** (B+A, M). D6, FR-CASE-08.
  Now: outbox processor and `blockchainAnchor.job.js` exist.
  Do: re-target to donation, case transition, authorization and report anchors, with idempotency keys so nothing anchors twice.
- [ ] **G18. Encrypted evidence on IPFS** (B, S). D8.
  Now: IPFS client and `contentEncryption.js` exist.
  Do: confirm CID plus plaintext hash is recorded, only public-flagged files skip encryption, evidence is attached to donations and disbursements.

### Public views
- [ ] **G19. Public trace** (B, M). FR-TRACE-01, 02, 05.
  Do: `GET /public/trace/:receipt` with status (received, pooled, partly or fully allocated), allocation lines, tx hash, block, explorer link. Throttle lookups against code guessing.
- [ ] **G20. Public stats** (B, S). FR-TRACE-04.
  Now: `/public/transparency/dashboard`.
  Do: `GET /public/stats` with totals in and out, balance, pool age, outflow by category and sub-group, beneficiaries helped, latest anchored report. No personal data.

### Reports
- [ ] **G21. Quarterly reports** (B, L). FR-REP-01 to 04.
  Now: `reports/` is entirely stubs and not mounted.
  Do: `POST /reports/quarterly`, `GET /reports/:id`, `GET /reports/:id/pdf`, `GET /public/reports`. Deterministic canonical JSON, PDF printing the hash and a QR code, hash plus ledger root anchored on-chain, closed periods get a new visible version instead of regeneration.

### Forensics and audit
- [ ] **G22. Phase 1 rules and alert inbox** (C, L). FR-FOR-01 to 03, section 12.
  Now: 7 rules, different set.
  Do: R01, R02, R03, R04, R05, R06, R08, R09, R10, R11, R13, R15, R16 (PRD needs at least 8). Alerts with rule ID, severity, evidence links, risk score 0 to 100, status. `GET /alerts`, `GET /alerts/:id`, `POST /alerts/:id/resolve` (note required, never deleted). Run on each event plus a nightly full pass.
- [ ] **G23. Audit access** (C, S). FR-AUD-01, FR-AUD-04.
  Now: hash chain and verify endpoint exist.
  Do: `GET /audit`, read-only for everyone including system admin.
- [ ] **G24. Auth and admin gaps** (B, M). FR-AUTH-03, FR-AUTH-04.
  Do: `POST /users`, `PATCH /users/:id/roles` (admin only, logged and anchored), refresh rotation, idle timeout, 2FA enforced for privileged roles.

---

## P2. Phase 2 (strong version)

- [ ] **G25. Daily ledger digest** (C+A, M). FR-AUD-02, FR-AUD-03, R17. Merkle root of the day's audit entries, `GET /public/digest/:day`, anchor on-chain, Chainlink Functions comparison and `IntegrityAlert`.
- [ ] **G26. Bank statement CSV import and reconciliation** (B, M). FR-INT-07, R07. `POST /bank/statements/import`, `GET /bank/reconciliation`, flag unmatched lines both ways.
- [ ] **G27. Foreign currency** (B, S). FR-INT-09. Store original amount, currency, rate source and converted KES, Chainlink FX feed.
- [ ] **G28. Rules table, tuning and fund flow graph** (C, L). FR-FOR-04, FR-FOR-05. `GET /rules`, `PATCH /rules/:id` within safe bounds, `GET /graph`, plus R07, R12, R14, R17 to R20 (Benford check included).
- [ ] **G29. Donor claim and display choices** (B, L). FR-DON-03 to 06, FR-DON-11. `POST /public/donor/claim`, `GET /public/donor/me`, `PATCH /public/donor/preferences` with preview-and-confirm. Automatic name screening (English and Swahili blocklist, reserved words, lookalikes). Append-only preference events.
- [ ] **G30. Badges** (B, L). FR-DON-07 to 10, R19, R20. Bronze, Silver, Gold plus lifetime Patron, thresholds table with second committee approval (`POST /badge-tiers`), 7-day cooling period, reversals, consistent-giver badge, nightly recompute, each award audited.
- [ ] **G31. Recognition wall and moderation** (B, M). FR-DON-12, 15, 16. `GET /public/recognition` with no amounts or exact dates and anonymous count only at 5 or more, `POST /public/recognition/:id/report`, `POST /recognition/names/:id/takedown` (reason required), `GET /donors/:ref` masked with logged reveal.
- [ ] **G32. Donor receipt by SMS or email** (B, S). Reuse `integrations/sms` and `notifications`.
- [ ] **G33. Fraud simulator** (C, L). Section 12.4. `backend/src/simulator` generates a year of activity with the 10 labelled scenarios, reports precision and recall per rule. This feeds Chapter Four.

## P3. Stretch

- [ ] **G34.** Public read-only auditor API.
- [ ] **G35.** Testnet stablecoin channel.
- [ ] **G36.** Backend support for browser Merkle proof verify and Chainlink Automation.
- [ ] **G37.** Donor thank-you certificate (FR-DON-14).

---

## Existing modules: reuse or park

| Module | Decision |
|---|---|
| `auth`, `sessions`, `users`, `roles` | Keep, rework roles (G02, G24) |
| `auditLogs`, `evidence`, `blockchainAudit`, `events/outbox`, `integrations/*` | Keep, re-target (G17, G18) |
| `approvals`, `committee` | Reuse for case decisions (G14) |
| `disbursements` | Adapt (G16) |
| `inventory`, `physicalDonations` | Adapt, drop the donor confirmation round trip (G10) |
| `reconciliation`, `forensicAnalytics`, `transparency` | Extend (G26, G22, G20) |
| `recognition`, `publicProfiles`, `donors` | Rework (G06, G29 to G31) |
| `students`, `universityRecords`, `applications`, `vetting`, `goodsCollections`, `confirmations` | Not in the PRD. Park (unmount from routes), do not delete until the team agrees |
| `complaints`, `policies` | Empty stubs. Park |
