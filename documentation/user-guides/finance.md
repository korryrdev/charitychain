# Finance & Treasurer User Guide (`/finance`, `/app/donations`)

Finance Operators (`FINANCE_OPERATOR`) and Treasurers (`TREASURER`) enter and maker-checker verify bank deposits, import CSV bank statements for 2-way reconciliation, disburse committee-authorized payouts with evidence CIDs, and manage M-Pesa/bank exceptions ([PRD FR-INT-06, FR-INT-07, FR-CASE-06](../requirements/product-requirements-document.md)).

---

## 1. Prerequisites & Mandatory MFA

* Sign in via `/auth/login` or `/login` (`TREASURER` requires TOTP MFA per `FR-AUTH-01`).
* **Payout Boundary:** Finance operators **cannot** raise authorized ceilings or change committee-approved recipients; payouts above the authorized amount are rejected in API (`FR-CASE-07`, `R02`) and `CaseWorkflow.sol`.

---

## 2. Bank Deposit Entry & Maker-Checker Verification (`/app/donations`, `/donations/bank`)

1. **Maker Step (`POST /api/v1/donations/bank`):** Treasurer A enters a bank deposit (reference, date, amount, currency e.g. `KES` or `USD`, optional consent version for bank donors). Status starts `PENDING_VERIFICATION`—no `DonationLot` exists yet.
2. **Checker Step (`POST /api/v1/donations/bank/:id/verify`):** A **different** Treasurer B (`assertSegregation`, `R04`) verifies the entry against bank confirmation, converting any FX via active rate source into KES minor units and provisioning the FIFO `DonationLot` (`MLK-XXXX-XXXX`) + `OutboxEvent`.

---

## 3. Bank Statement CSV Import & 2-Way Reconciliation

1. Upload bank statement CSV payloads (`POST /api/v1/donations/bank/statements/import`).
2. Inspect automated matches and unmatched statement lines or ledger entries via `GET /api/v1/donations/bank/reconciliation` (`FR-INT-07`).
3. Unreconciled differences raise alert `R07` (`RECONCILIATION_MISMATCH`) for resolution.

---

## 4. Executing Disbursements & Managing Exceptions (`/finance`)

1. Open `/finance/disbursements` (campus payout queue) or `/committee/cases` (`AUTHORIZED` cases ready to disburse).
2. Execute university B2B tuition Paybill / bank payment or student M-Pesa B2C upkeep payout (`POST /api/v1/cases/:id/disburse`), attaching payment reference and evidence file (AES-256-GCM encrypted & pinned to IPFS, `R01` blocks missing evidence).
3. Monitor M-Pesa callbacks and `stkPushQuery` / `transactionStatus` reconciliation on `/finance/reconciliation` and resolve payout exceptions at `/finance/exceptions`.
