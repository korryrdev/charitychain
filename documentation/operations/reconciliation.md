# Money, Inventory & Forensic Reconciliation Operations

Reconciliation verifies conservation of value across Daraja mobile money, bank deposits, FIFO lots, physical inventory, and on-chain daily Merkle anchors ([PRD §7.3, §7.6, §12](../requirements/product-requirements-document.md)).

---

## 1. Reconciliation Workflows

| Channel | Mechanism & Frequency | Tolerance / Segregated Controls | Anomaly Rule |
| --- | --- | --- | --- |
| **M-Pesa Daraja (C2B / STK / B2C / B2B)** | Tokenized webhooks (`DonationRawCallback`) + `stkPushQuery.adapter.js` / `transactionStatus.adapter.js` + `mpesaResultCodes.js` | Replayed callbacks ignored idempotently; incomplete/pending payments queried automatically before crediting. | `R06` (`transaction status mismatch`) |
| **Bank Deposits & CSV Statements** | `POST /api/v1/donations/bank` (Treasurer A) -> `POST /api/v1/donations/bank/:id/verify` (Treasurer B) -> CSV import (`POST /api/v1/donations/bank/statements/import`) | `verifier !== creator` enforced in code; unmatched statement lines or ledger deposits quarantined into `GET /api/v1/donations/bank/reconciliation`. | `R04` (`self-verify`), `R07` (`statement mismatch`) |
| **FIFO Pool Drift** | `lots.service.js` periodic & event-driven check | Enforces `SUM(remainingMinor) === verifiedInflowMinor - disbursedOutflowMinor` in integer minor units. | `R16` (`pool balance drift`) |
| **Physical Goods & Pharmacy Inventory** | Clerk desk handover vs. independent donor & student confirmations (`/clerk/reconciliation`, `StockCount`) | Issued quantities cannot exceed inspected/accepted batch balances. Variance triggers supervisor review. | `R15` (`stock shrinkage`) |
| **PostgreSQL vs. Polygon Ledger** | Daily UTC audit digest (`GET /api/v1/public/digest/:day`) anchored to `PeriodAnchor` & verified by `ChainlinkFxAndAutomation` | Any post-anchor mutation produces digest mismatch and surfaces on `/auditor`. | `R17` (`digest mismatch`) |

See operational variance playbooks in [reconciliation-variance.md](../../infrastructure/runbooks/reconciliation-variance.md) and [inventory-variance.md](../../infrastructure/runbooks/inventory-variance.md).

---

## 2. Running Forensic Scans & Benchmarking

* Trigger rule scan across live ledger via API (`POST /api/v1/alerts/scan` with `alert:resolve`) or inspect alerts & rules on `/auditor/forensic-rules`.
* Tune configurable rule bounds safely via `PATCH /api/v1/alerts/rules/:id`.
* Benchmark precision/recall across the 10 seeded fraud scenarios using `backend/src/simulator/fraudSimulator.js`.
