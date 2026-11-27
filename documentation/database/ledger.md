# Append-Only Financial Ledger, Triggers & FIFO Integrity

CharityChain guarantees financial completeness off-chain before anchoring daily Merkle digests on Polygon ([PRD §5 D4, D6, §7.3, §10.1](../requirements/product-requirements-document.md)).

---

## 1. PostgreSQL Append-Only Triggers

Installed by [migration.sql](../../database/prisma/migrations/20261110230000_prd_entities_and_triggers/migration.sql):

```sql
CREATE OR REPLACE FUNCTION prevent_append_only_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% rows are append-only and cannot be updated or deleted', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
```

Bound `BEFORE UPDATE OR DELETE` on:
* `case_events` (`case_events_append_only`)
* `allocations` (`allocations_append_only`)
* `donation_raw_callbacks` (`donation_raw_callbacks_append_only`)

Attempts by any application session or admin script to `UPDATE` or `DELETE` historical rows fail directly in PostgreSQL (`database/tests/constraints.test.js` and `backend/tests/integration/prdEntitiesAndTriggers.test.js`).

---

## 2. FIFO Lot Accounting & Double-Entry Journals

1. **Pooled FIFO Lots (`DonationLot` & `LotAllocation`):**
   * Every verified M-Pesa confirmation, maker-checker Bank deposit, stablecoin gift, or valued in-kind entry creates an immutable initial balance (`initialMinor`) and tracks `remainingMinor`.
   * Disbursements call `lots.service.js` to allocate integer minor units FIFO—draining lots matching the case's earmark first, then general pool lots (`lotsAndFifo.test.js`).
   * **Conservation Invariant (`R16`):** Nightly checks enforce `SUM(DonationLot.remainingMinor) === SUM(verified inflows) - SUM(LotAllocation.amountMinor)`.
2. **Double-Entry Journals (`LedgerAccount`, `LedgerJournal`, `LedgerEntry`):** Tracks campus inflows, commitments, payouts, and reconciliation postings (`database/tests/ledger.test.js`).
3. **Hash-Chained Audit Log (`AuditEvent`) & Outbox (`OutboxEvent`):** Each audit record stores `prevHash` and canonical digest verified by `auditLogs/dailyDigest.service.js`; state changes commit `OutboxEvent` rows in the same Prisma transaction so anchors never drop on process crashes.
