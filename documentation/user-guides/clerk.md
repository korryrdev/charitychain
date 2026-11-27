# Clerk & Pharmacy Custodian User Guide (`/clerk`, `/inventory/pharmacy`)

Physical intake staff (`CLERK`, `PHARMACY_CUSTODIAN`, `INVENTORY_SUPERVISOR`) manage campus desk drop-offs, mobile-first pharmacy item logs, inspections, student pack handovers, and stock reconciliation without bypassing two-party confirmations (`PRD FR-INT-08`, `FR-FLOW-05`).

---

## 1. Desk Physical Intake (`/clerk/receive`)

1. Open `/clerk/receive` when a donor drops off physical items or physical cash.
2. Record the donor reference, item categories, quantities, condition, batch/expiry details, approved estimated value, and notes.
3. Submission puts the entry into `AWAITING_DONOR_CONFIRMATION` (stocked inventory does **not** increase yet).
4. Monitor confirmations on `/clerk/confirmations`; if a donor selects **No**, submit a corrected entry (rejected history stays in the audit trail).
5. Once donor-confirmed, inspect goods at `/clerk/inspect/:donationId` (`Accepted`, `Quarantined`, `Rejected`). Only `Accepted` batches increase available stock.

---

## 2. Mobile-First Pharmacy Quick Log (`/inventory/pharmacy`)

For campus hospital pharmacy custodians (`PHARMACY_CUSTODIAN` / `INVENTORY_SUPERVISOR`):
1. Open `/inventory/pharmacy` (`PharmacyItemPage.tsx`).
2. Quickly log item category, quantity (`ITM` units), condition, optional valuation/photo evidence, and donor reference (`POST /api/v1/donations/items`).
3. Confirmed entries anchor to `DonationLedger.sol` under `Channel.IN_KIND` (`"ITM"` currency) and remain traceable publicly via `MLK-XXXX-XXXX`.

---

## 3. Student Collection Handover (`/clerk/collections`) & Daily Reconciliation (`/clerk/reconciliation`)

1. Verify student registration number and remaining category allowances at `/clerk/collections`.
2. Propose items and await the student's **independent Yes confirmation** (`/confirm-goods`) before handing over physical goods.
3. Run end-of-day reconciliation on `/clerk/reconciliation` comparing opening stock, confirmed intake, distributions, damaged/expired stock, and physical counts (variances alert rule `R15` for supervisor & auditor review).
