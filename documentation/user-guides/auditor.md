# Forensic Auditor User Guide (`/auditor`, `/auditor/fund-flow-dag`, `/auditor/forensic-rules`)

Internal and external auditors (`AUDITOR`, `MEMBER_AUDITOR`) inspect end-to-end money and physical-goods trails, traverse the interactive 5-column PostgreSQL Fund-Flow DAG, triage R01–R20 risk alerts with mandatory audit notes, verify blockchain Merkle proofs, and download deterministic quarterly reports.

> [!NOTE]
> Per `FR-AUTH-03` and [roles.js](../../backend/src/constants/roles.js), `AUDITOR` and `MEMBER_AUDITOR` are read-only oversight roles (`canApproveOrDisburseFunds() === false`) and can never approve payouts or edit ledger history.

---

## 1. Fund-Flow DAG Explorer (`/auditor/fund-flow-dag`, `/app/graph`)

* Loads live connected nodes and allocation flows via `GET /api/v1/alerts/graph`.
* Displays the **5-column end-to-end topology**: `Donors (masked/HMAC) -> Channels & Donation Lots -> Sub-Group Cases -> 2-of-3 Signatories / Approvers -> Disbursements & Evidence`.
* Highlights active forensic anomalies overlaid directly on suspect nodes and edges.

---

## 2. Forensic Alert Inbox, Rules R01–R20 & Benford's Law (`/auditor/forensic-rules`, `/auditor/anomalies`)

1. Open `/auditor/forensic-rules` (`AlertsPage.tsx`) or `/auditor/anomalies`.
2. Inspect open alerts ranked by risk score (`0–100`) with rule ID (`R01`–`R20`), plain-language trigger explanation, and linked evidence IDs.
3. **Resolve or Dismiss with Mandatory Audit Note (`FR-FOR-03`):** Resolving (`POST /api/v1/alerts/:id/resolve`) appends an immutable `ForensicAlertEvent`; historical alerts can never be deleted.
4. Inspect Benford's Law first-digit checks (`R18`) and adjust safe bounded rule thresholds (`PATCH /api/v1/alerts/rules/:id`).

---

## 3. Money, Goods, Blockchain & Digest Verification (`/auditor/money`, `/auditor/goods`, `/auditor/blockchain`)

* **Money & Pool Conservation:** Reconcile opening balances, inflows, commitments, payouts, and `R16` FIFO pool balance invariance.
* **Goods Reconciliation (`/auditor/goods`):** Verify accepted vs. released inventory batches and investigate `R15` shrinkage variances.
* **Blockchain & Merkle Integrity (`/auditor/blockchain`, `/auditor/quarterly-reports`):**
  * Export read-only audit streams (`GET /api/v1/public/audit/export`)
  * Verify daily UTC Merkle roots (`GET /api/v1/public/digest/:day`), per-event inclusion proofs (`POST /api/v1/public/verify-proof`), and Chainlink upkeep status (`GET /api/v1/public/chainlink/automation`)
  * Validate deterministic quarterly report hashes anchored in `PeriodAnchor.sol`.
