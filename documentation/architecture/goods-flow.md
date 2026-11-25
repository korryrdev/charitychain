# Physical-Goods Flow Architecture

Campus hospital pharmacy drop-offs (`PHARMACY_CUSTODIAN`) and desk drop-offs (`CLERK`) pass through mandatory independent two-party confirmations and inspection gates before affecting available inventory stock (`FR-INT-08`, `FR-FLOW-05`, `R15`).

---

## 1. End-to-End Physical Intake & Distribution Flow

```mermaid
flowchart LR
  DONOR["Donor Drop-Off / Declaration"] --> DESK["Clerk / Pharmacy Intake<br/>/clerk/receive or /inventory/pharmacy"]
  DESK -->|"AWAITING_DONOR_CONFIRMATION"| DCONF{"Independent Donor Confirmation<br/>Yes / No / Expired"}
  DCONF -->|No / Correction Needed| REJ["Rejected / Corrected Record<br/>(Audit Preserved)"]
  DCONF -->|Yes| INSP["Physical Inspection<br/>/clerk/inspect/:donationId"]
  INSP -->|Quarantined / Damaged / Unsafe| QUAR["Quarantined / Not Stocked"]
  INSP -->|Accepted| STOCK["InventoryBatch & SKU Stock<br/>(StockMovement + In-Kind Lot ITM)"]
  STOCK --> REQ["Student Pack Request<br/>(Eligibility + Category Limits Checked)"]
  REQ --> SCONF{"Independent Student Confirmation<br/>Yes / No Before Release"}
  SCONF -->|No / Rejected| RETRY["Held / Returned to Stock<br/>(Exception Logged)"]
  SCONF -->|Yes| HANDOVER["Released & Receipt Issued<br/>Permanent Stock Reduction"]
```

---

## 2. Key Controls & Segregation Invariants

1. **No Unconfirmed Stock Entry (`FR-INT-08`):** Neither a donor's pre-declaration on `/donor/goods` nor a clerk's desk receipt creates available inventory. Both the clerk entry and an **independent donor confirmation** (with inspection acceptance) are required before stock enters `InventoryBatch`.
2. **Physical Cash Separation:** Cash dropped physically (`PhysicalCashDeposit`) enters `Donor Confirmed -> Cash Held -> Deposit Pending -> Deposit Matched -> Reconciled` and counts toward pool funds only once matched to a central-account bank deposit.
3. **Mobile-First Pharmacy Channel (`Channel.IN_KIND`, `ITM`):** `/inventory/pharmacy` (`PharmacyItemPage.tsx`) records campus pharmacy donations (`POST /api/v1/donations/items`) anchored to `DonationLedger.sol` using currency `"ITM"` and item count as `amountMinor`.
4. **Controlled Allowances & Independent Student Handover:** Goods collection (`GoodsCollectionPolicy`, `goodsCollections.service.js`) validates per-category/total limits and time-bounded reservations; the clerk **cannot** bypass limits or submit confirmation on the student's behalf.
5. **Shrinkage Forensics (`R15`):** Any variance where issued stock exceeds accepted stock or physical stock counts diverge triggers forensic rule `R15` (`inventoryVariance.rule.js`) for supervisor/auditor review.
