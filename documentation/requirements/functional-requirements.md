# Functional Requirements Catalogue

All stable requirement identifiers (`FR-*`) below originate in [Product Requirements Document §7](./product-requirements-document.md#7-functional-requirements) and cover both the Malkia blockchain notary workflow and the campus student-assistance and physical-goods workflows in the unified platform.

---

## 1. Donation Intake (`FR-INT`)

* **FR-INT-01:** Register Safaricom Daraja C2B validation/confirmation URLs and accept paybill confirmations (`/api/v1/daraja/c2b/validation/:token`, `/confirmation/:token`).
* **FR-INT-02:** Persist every payment callback immutably as raw JSON (`DonationRawCallback`) before creating or crediting a `DonationLot`.
* **FR-INT-03:** Enforce strict idempotency on M-Pesa transaction IDs so replayed callbacks never create duplicate lots.
* **FR-INT-04:** Protect webhook/callback ingress with tokenized paths (`:token`), validation schemas, and configurable source/secret checks.
* **FR-INT-05:** Query Daraja Transaction Status / STK Push Query (`stkPushQuery.adapter.js`, `transactionStatus.adapter.js`) for pending/incomplete payments and raise forensic rule `R06` on mismatches.
* **FR-INT-06:** Enable `TREASURER` bank deposit entry (`POST /api/v1/donations/bank`) with segregated maker-checker verification (`POST /api/v1/donations/bank/:id/verify`, `verifier !== creator`) before provisioning funds.
* **FR-INT-07:** Support bank statement CSV import (`POST /api/v1/donations/bank/statements/import`) and automated 2-way reconciliation (`GET /api/v1/donations/bank/reconciliation`), raising rule `R07` on unmatched lines.
* **FR-INT-08:** Allow `PHARMACY_CUSTODIAN` (`/inventory/pharmacy`) and `CLERK` (`/clerk`) staff to log physical/in-kind donations with quantity, unit (`ITM`), condition, optional valuation, and evidence attachment, requiring independent donor Yes/No confirmation at the desk before entering stock.
* **FR-INT-09:** Record foreign-currency donations and testnet stablecoin contributions (`POST /api/v1/public/crypto/stablecoin`) with original currency, FX rate source (Chainlink USD/KES feed or fallback), and minor-unit KES equivalent.
* **FR-INT-10:** Generate a deterministic, check-friendly receipt code (`MLK-XXXX-XXXX` via `receiptCode.js`) for every verified donation alongside M-Pesa receipt lookup.
* **FR-INT-11:** Support optional category-level earmarks (e.g., Tuition, Upkeep, Medical/Sanitary) with unrestricted pooling as default.

---

## 2. Cases, Student Vetting & Approvals (`FR-CASE`)

* **FR-CASE-01:** Allow `SUBGROUP_REP` users to raise `MalkiaCase` entries (`/committee/cases/new`, `POST /api/v1/cases`) and authenticated MUST students (`/student/apply`) to submit assistance applications linked to `CTxxx/xxxxxx/yy` (e.g. `CT206/204483/24`) student records. Keep beneficiary PII encrypted off-chain.
* **FR-CASE-02:** Enforce valid state transitions (`DRAFT -> SUBMITTED -> UNDER_REVIEW <-> NEEDS_INFO -> APPROVED/REJECTED -> AUTHORIZED -> DISBURSED -> CLOSED`) across API services and `CaseWorkflow.sol`.
* **FR-CASE-03:** Allow `COMMITTEE_MEMBER` decisions (approve with exact approved amount, decline, or request additional info) alongside explainable automated Need-Index vetting and student appeals (`StudentAppeal`).
* **FR-CASE-04:** Enforce code-level segregation so a submitter/creator cannot approve their own case (`R03`).
* **FR-CASE-05:** Require **2-of-3 distinct EIP-712 `SIGNATORY` authorizations** (`POST /api/v1/cases/:id/authorize`, incremental or batch) verified via `CaseWorkflow.sol` (`"CharityChain CaseWorkflow"` v1) before payout release.
* **FR-CASE-06:** Record disbursements (`POST /api/v1/cases/:id/disburse` or Finance `/finance`) with method, provider reference, and encrypted IPFS evidence CID.
* **FR-CASE-07:** Reject any disbursement exceeding the authorized ceiling (`R02` / contract revert).
* **FR-CASE-08:** Record every transition in append-only `CaseEvent` tables (PostgreSQL `BEFORE UPDATE OR DELETE` trigger) and enqueue blockchain anchoring via `OutboxEvent`.
* **FR-CASE-09:** Redact beneficiary names, registration numbers, and phone numbers from all public routes and non-privileged auditor/member summaries.

---

## 3. Lot Allocation, Inventory & Fund Flow (`FR-FLOW`)

* **FR-FLOW-01:** Provision a `DonationLot` (`remainingMinor`) for every verified donation.
* **FR-FLOW-02:** Consume lots in FIFO order (`lots.service.js`), matching earmarks first before unrestricted pool lots, writing immutable `LotAllocation` lines.
* **FR-FLOW-03:** Run invariant verification confirming `sum(remaining) === totalInflow - totalOutflow`, raising Critical forensic alert `R16` on any drift.
* **FR-FLOW-04:** Render lot-to-case allocation slices as interactive Sankey flows on `/trace` and as a 5-column Fund-Flow DAG on `/auditor/fund-flow-dag`.
* **FR-FLOW-05:** Track physical inventory (`InventoryCategory`, `InventoryItem`, `InventoryBatch`, `StockMovement`) through receipt, inspection, reservation, student-confirmed release, and expiry/shrinkage monitoring (`R15`).

---

## 4. Donor Trace & Transparency (`FR-TRACE`)

* **FR-TRACE-01:** Public, unauthenticated lookup by receipt code on `/trace` (`GET /api/v1/public/trace/:receipt`) showing status, pool state, allocation slices, and redacted need categories.
* **FR-TRACE-02:** Display on-chain anchoring proof (transaction hash, block metadata, Polygon Amoy explorer link).
* **FR-TRACE-03:** Provide a 1-click browser **Verify Direct on Chain** action using `Web3.js` RPC calls to recompute `hashDonation` and compare against `DonationLedger.recordHashOf(donationId)` independently of the API.
* **FR-TRACE-04:** Public dashboard (`/`, `/transparency`, `/dashboard`, `GET /api/v1/public/stats`) showing inflows, outflows, pool balance, category breakdowns, beneficiary counts, and anchored reports with zero PII.
* **FR-TRACE-05:** Enforce API rate limits and IP throttling on trace and claim endpoints to prevent receipt-code enumeration.

---

## 5. Quarterly Reports (`FR-REP`)

* **FR-REP-01:** Generate quarterly transparency reports (`POST /api/v1/reports/quarterly`) summarizing opening/closing balances, inflows by channel, outflows by category/sub-group, in-kind movements, and open alerts.
* **FR-REP-02:** Produce deterministic canonical JSON (`canonicalJson.js`) so identical closed periods yield identical hashes.
* **FR-REP-03:** Anchor `reportHash` and `periodRoot` on `PeriodAnchor.sol` and render verifiable downloads/hashes on `/reports` and `/auditor/quarterly-reports`.
* **FR-REP-04:** Preserve immutability by creating a sequential version number for corrected reports rather than overwriting existing records.

---

## 6. Forensics & Integrity (`FR-FOR`, `FR-AUD`)

* **FR-FOR-01..05:** Execute rules **R01–R20** (event-driven and full scan), score alerts `0–100`, enforce mandatory resolution notes (`POST /api/v1/alerts/:id/resolve`) with append-only `ForensicAlertEvent` history, visualize 5-column Fund-Flow DAGs (`GET /api/v1/alerts/graph`), run Benford's Law analysis, and allow bounded threshold tuning (`PATCH /api/v1/alerts/rules/:id`).
* **FR-AUD-01..04:** Maintain hash-chained `AuditEvent` records (`prevHash`, monotonic `seq`), compute daily UTC ledger Merkle roots (`GET /api/v1/public/digest/:day`), anchor via `PeriodAnchor.anchorDaily` and `ChainlinkFxAndAutomation.sol`, expose read-only exports (`GET /api/v1/public/audit/export`) and Merkle inclusion proofs (`POST /api/v1/public/verify-proof`), and block audit edits for every role including admins.

---

## 7. Authentication & Donor Privacy / Recognition (`FR-AUTH`, `FR-DON`)

* **FR-AUTH-01..04:** Email/password auth with Better-Auth, MUST student registration (`name123456@students.must.ac.ke`), mandatory TOTP MFA (`COMMITTEE_MEMBER`, `TREASURER`, `SIGNATORY`), signatory EIP-712 wallet linkage, logged/anchored role changes, short-lived session rotation, and code-enforced admin non-financial restrictions.
* **FR-DON-01..16:** Server-keyed HMAC `donorRef` references, **`ANONYMOUS` default public display**, receipt-code `/claim` workflow with preview confirmation and automated English/Swahili/reserved/lookalike screening (`nameScreening.js`), append-only consent versioning (`DonorPreferenceEvent`), deterministic Bronze/Silver/Gold/Patron/Consistent-Giver badges (`badges.service.js`, 7-day cooling period), institutional portal tiers (`Silver/Gold/Diamond/Platinum`), k-anonymous public recognition wall (`anonymousDonorsCount` hidden below 5, zero amounts/exact dates), SVG thank-you certificate (`GET /api/v1/public/certificate/:receipt`), masked admin lookup with logged reason reveal, and committee takedown (`FR-DON-16`).
