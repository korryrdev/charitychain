# Acceptance Criteria, Success Metrics & Gap Verification (G01–G37)

This document consolidates the PRD evaluation targets ([PRD §3.3](./product-requirements-document.md#33-success-metrics)), Integration Checkpoints ([Architecture §10](../architecture/overview.md#10-integration-checkpoints)), and the complete verified implementation checklist (`G01`–`G37`) across all three delivery phases.

---

## 1. Quantitative Project Success Metrics (PRD Section 3.3)

| Metric | Target | Status / Verification Mechanism |
| --- | --- | --- |
| Donation captured in ledger after M-Pesa confirmation | p95 `< 30s` | Single ACID transaction in `daraja.service.js` + Daraja sandbox tests (`daraja.test.js`) |
| Donation visible on trace page after capture | p95 `< 60s` including anchoring | Immediate Postgres `DonationLot` + `/trace` availability (`transparency.test.js`) + outbox relay |
| Donors completing "Trace My Donation" unaided | `>= 90%` in usability test | Unauthenticated receipt lookup + 1-click browser `Web3.js` verify (`/trace`) |
| Seeded fraud scenarios detected by forensic engine | Recall `>= 90%`, Precision `>= 70%` | 12-month 10-scenario seeded simulator (`backend/src/simulator/fraudSimulator.js`, `phase2Features.test.js`) |
| Time to produce a quarterly report | `< 5 minutes` | Automated deterministic aggregation (`reports.service.js`) & `PeriodAnchor.anchorReport` |
| Smart contract approval-path test coverage | `100%` of approval/release paths | Hardhat unit tests (`CoreContracts.test.js`, `CharityChainAccess.test.js`, `EvidenceRegistry.test.js`) |

---

## 2. Integration Checkpoints (`IC0`–`IC4`)

* **IC0 (Interfaces Frozen):** Canonical hashing rules, OpenAPI/route validation, Prisma schema + triggers, `ChainClient` interface, and RBAC matrices locked. (**Completed**)
* **IC1 (First Donation):** Tokenized Daraja C2B confirmation creates `DonationLot` (`MLK-XXXX-XXXX`), queues `OutboxEvent` to `DonationLedger`, and `/trace` verifies record hash via browser `Web3.js`. (**Completed**)
* **IC2 (Case to Payout):** Sub-group raises case -> segregated committee approves -> 2-of-3 signatories execute EIP-712 release via MetaMask/`Web3.js` (`/committee/signing`) -> FIFO allocation & IPFS-backed disbursement. (**Completed**)
* **IC3 (Alerts & Dashboard):** R01–R20 rules, Benford's Law check, 10-scenario simulator, 5-column Fund-Flow DAG (`/auditor/fund-flow-dag`), and daily Merkle root anchoring operational. (**Completed**)
* **IC4 (Unified Demo Candidate):** Polygon Amoy deployment config, `ChainlinkFxAndAutomation.sol` Data Feed + Automation contract, 9 unified RBAC portals + `.tsx` governance screens, quarterly reports, and full 284-test suite green. (**Completed**)

---

## 3. Verified Implementation Checklist (`G01`–`G37`)

### P0. Foundations

- [x] **G01. Lock the chain interface** (`D1`, `D5`, `D6`, PRD §9): Implemented `DonationLedger.sol`, `CaseWorkflow.sol`, `PeriodAnchor.sol`, `SignatoryRegistry.sol`, `EvidenceRegistry.sol`, `CharityChainAccess.sol`, and `ChainlinkFxAndAutomation.sol` with Solidity `0.8.28`. ABIs exported to `shared/abis/`. Verified in `blockchain/test/unit/`.
- [x] **G02. Roles and permission matrix** (PRD §4.2, `FR-AUTH-01`, `FR-AUTH-03`): Configured 14 roles (`SUBGROUP_REP`, `COMMITTEE_MEMBER`, `TREASURER`, `SIGNATORY`, `PHARMACY_CUSTODIAN`, `MEMBER_AUDITOR`, `SYSTEM_ADMIN`, plus `DONOR`, `STUDENT`, `CLERK`, `INVENTORY_SUPERVISOR`, `FINANCE_OPERATOR`, `AUDITOR`, `ADMINISTRATOR`) and 55 permissions. Enforced mandatory 2FA (`COMMITTEE_MEMBER`, `TREASURER`, `SIGNATORY`) and non-financial admin guard (`rolesAndPermissions.test.js`).
- [x] **G03. Money as integer minor units** (PRD §10.1): BigInt integer minor-unit math in `backend/src/utils/money.js` across `DonationLot`, `MalkiaCase`, `Disbursement`, and `LedgerEntry` (`utilities.test.js`).
- [x] **G04. Core utilities** (`canonicalJson.js`, `money.js`, `pagination.js`, `dates.js`, `retry.js`, `assertions.js`, `merkle.js`): Implemented and verified (`utilities.test.js`).
- [x] **G05. Schema & PostgreSQL immutability triggers** (PRD §10.1): Applied 26 Prisma migrations including `20261110230000_prd_entities_and_triggers` (`BEFORE UPDATE OR DELETE` blocking edits on `case_events`, `allocations`, and `donation_raw_callbacks`). Verified in `prdEntitiesAndTriggers.test.js` and `database/tests/constraints.test.js`.
- [x] **G06. Donor reference model** (`D9`, `FR-DON-01`, `FR-DON-02`): Server-keyed HMAC-SHA256 `donorRef` in `donorReference.js`, defaulting to `ANONYMOUS` (`donorReference.test.js`).

### P1. Phase 1 MVP Core

- [x] **G07. Daraja C2B endpoints** (`FR-INT-01..04`): `/api/v1/daraja/c2b/validation/:token` and `/confirmation/:token` with immutable raw callbacks and transaction-ID idempotency (`daraja.test.js`).
- [x] **G08. Receipt codes & earmarks** (`FR-INT-10`, `FR-INT-11`): `MLK-XXXX-XXXX` generator/validator in `receiptCode.js` (`daraja.test.js`).
- [x] **G09. Bank deposit entry & maker-checker** (`FR-INT-06`, `FR-DON-03`, `R04`): `POST /api/v1/donations/bank` & `POST /api/v1/donations/bank/:id/verify` enforcing `verifier !== creator` (`bankDeposit.test.js`).
- [x] **G10. In-kind item log & issuance** (`FR-INT-08`, `FR-FLOW-05`): `POST /api/v1/donations/items` (`IN_KIND` in `ITM` units) and `POST /api/v1/inventory/issue` (`items.test.js`).
- [x] **G11. Lot model & FIFO allocation** (`D4`, `FR-FLOW-01`, `FR-FLOW-02`, `FR-FLOW-04`): Earmark-first FIFO consumption in `lots.service.js` (`lotsAndFifo.test.js`).
- [x] **G12. Pool-drift check** (`FR-FLOW-03`, `R16`): Enforces `remaining === inflow - allocated` and raises critical alert on drift (`lotsAndFifo.test.js`).
- [x] **G13. Sub-groups, cases & state machine** (`FR-CASE-01, 02, 08, 09`): `GET /api/v1/cases/subgroups`, `POST /api/v1/cases`, `POST /api/v1/cases/:id/submit`, off-chain encrypted PII, append-only `CaseEvent` (`casesWorkflow.test.js`).
- [x] **G14. Committee decision** (`FR-CASE-03`, `FR-CASE-04`, `R03`): `POST /api/v1/cases/:id/decision` enforcing submitter segregation (`casesWorkflow.test.js`).
- [x] **G15. Signatory wallets & 2-of-3 EIP-712 release** (`D5`, `FR-AUTH-02`, `FR-CASE-05`): `POST /api/v1/cases/:id/authorize` supporting incremental and batch 2-of-3 signatures, paired with `SigningQueuePage.tsx` `Web3.js` + MetaMask `eth_signTypedData_v4` (`casesWorkflow.test.js`, `signing.test.tsx`).
- [x] **G16. Disbursement with evidence** (`FR-CASE-06`, `FR-CASE-07`, `R01`, `R02`): Ceiling check (`disbursed <= authorized`), evidence CID enforcement, and FIFO lot consumption (`casesWorkflow.test.js`).
- [x] **G17. Transactional outbox** (`D6`, `FR-CASE-08`): Atomic `OutboxEvent` creation and idempotent relay (`transactionalOutbox.test.js`).
- [x] **G18. Encrypted evidence on IPFS** (`D8`): AES-256-GCM wrapping + plaintext SHA-256 digest anchoring (`evidenceCryptography.test.js`, `ipfsAdapter.test.js`).
- [x] **G19. Public trace** (`FR-TRACE-01, 02, 05`): `GET /api/v1/public/trace/:receipt` + browser `Web3.js` `TracePage.tsx` (`transparency.test.js`).
- [x] **G20. Public stats** (`FR-TRACE-04`): `GET /api/v1/public/stats` excluding PII (`transparency.test.js`).
- [x] **G21. Quarterly reports** (`FR-REP-01..04`): `POST /api/v1/reports/quarterly` deterministic JSON & `PeriodAnchor` notarization (`reports.service.js`).
- [x] **G22. Forensic rules R01–R20 & alert inbox** (`FR-FOR-01..03`): `GET /api/v1/alerts`, `POST /api/v1/alerts/:id/resolve` (`forensicAnalytics.test.js`).
- [x] **G23. Audit access** (`FR-AUD-01`, `FR-AUD-04`): Read-only `GET /api/v1/audit` & `auditLogs.test.js`.
- [x] **G24. Auth, staff provisioning & role audit** (`FR-AUTH-03`, `FR-AUTH-04`): `POST /api/v1/users`, `POST /api/v1/users/staff`, `PATCH /api/v1/users/:id/roles` (`authAccess.test.js`).

### P2. Phase 2 Strong Features

- [x] **G25. Daily ledger digest & R17 check** (`FR-AUD-02`, `FR-AUD-03`, `R17`): `GET /api/v1/public/digest/:day`, `/proof/:eventId`, `PeriodAnchor.anchorDaily` (`dailyDigest.test.js`).
- [x] **G26. Bank statement CSV import & reconciliation** (`FR-INT-07`, `R07`): `POST /api/v1/donations/bank/statements/import` & `GET /api/v1/donations/bank/reconciliation` (`bankReconciliation.test.js`).
- [x] **G27. Foreign currency FX conversion** (`FR-INT-09`): Multi-currency capture + KES conversion (`bankReconciliation.test.js`).
- [x] **G28. Rule tuning, Benford check & 5-column DAG** (`FR-FOR-04`, `FR-FOR-05`): `GET /api/v1/alerts/rules`, `PATCH /api/v1/alerts/rules/:id`, `GET /api/v1/alerts/graph`, Benford check (`phase2Features.test.js`).
- [x] **G29. Donor claim, preview & name screening** (`FR-DON-03..06`, `FR-DON-11`): `POST /api/v1/public/donor/claim`, `GET /api/v1/public/donor/me`, `PATCH /api/v1/public/donor/preferences`, English/Swahili/leetspeak screening (`phase2Features.test.js`).
- [x] **G30. Deterministic badges & cooling period** (`FR-DON-07..10`, `R19`, `R20`): Bronze/Silver/Gold/Patron/Consistent-Giver badges (`phase2Features.test.js`).
- [x] **G31. Recognition wall & moderation** (`FR-DON-12, 15, 16`): `GET /api/v1/public/recognition` with k-anonymity (`>= 5`), visitor reporting, and committee takedown (`phase2Features.test.js`).
- [x] **G32. Donor receipt & transactional notifications**: Resend email integration + SMS receipt notification service (`notifications.test.js`).
- [x] **G33. 1-year Fraud Simulator** (PRD §12.4): `backend/src/simulator/fraudSimulator.js` with 10 labeled scenarios and precision/recall/F1 evaluation (`phase2Features.test.js`).

### P3. Stretch Deliverables

- [x] **G34. Public read-only auditor stream** (`FR-AUD-01`, `FR-AUD-04`): `GET /api/v1/public/audit/export` (`phase3Features.test.js`).
- [x] **G35. Testnet stablecoin intake**: `POST /api/v1/public/crypto/stablecoin` (`phase3Features.test.js`).
- [x] **G36. Browser Merkle proof verification & Chainlink FX/Automation**: `POST /api/v1/public/verify-proof`, `GET /api/v1/public/chainlink/automation`, plus `ChainlinkFxAndAutomation.sol` (`phase3Features.test.js`, `CoreContracts.test.js`).
- [x] **G37. Donor thank-you SVG certificate** (`FR-DON-14`): `GET /api/v1/public/certificate/:receipt` (`phase3Features.test.js`).
