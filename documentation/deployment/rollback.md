# Rollback & Recovery Procedure

Because CharityChain's PostgreSQL tables and Polygon smart contracts are **append-only and non-proxy**, rollbacks follow safe forward-compatible recovery rules rather than destructive state rewrites.

---

## 1. Stateless Frontend & Backend Container Rollback

1. Re-tag or deploy the previous verified `frontend` and `backend` container images (`infrastructure/docker/{frontend,backend}.Dockerfile`).
2. Confirm configuration parity in `.env` and verify `/api/v1/health/ready` returns `200 {"status":"ready"}`.
3. Existing `OutboxEvent` rows resume safely under idempotency keys after restart.

---

## 2. Database Migration Rollback Policy

* **Never execute destructive `DROP` / `TRUNCATE` / `UPDATE` on `case_events`, `allocations`, `donation_raw_callbacks`, or `audit_events`**, which are guarded by PostgreSQL triggers (`prevent_append_only_mutation()`).
* If a newly deployed schema change introduces an application defect, prefer deploying a **forward corrective migration** via Prisma (`npm run db:migrate`).
* Only for catastrophic corruption prior to traffic, restore from a verified backup snapshot using [infrastructure/backups/restore-procedure.md](../../infrastructure/backups/restore-procedure.md) and [infrastructure/runbooks/database-recovery.md](../../infrastructure/runbooks/database-recovery.md).

---

## 3. Smart Contract Pause & Versioned Redeploy

Per [PRD §9](../requirements/product-requirements-document.md#9-smart-contracts), CharityChain uses **zero upgradeable proxies**:
1. If an unexpected contract issue arises, call `pause()` via `PAUSER_ROLE` on the affected contract (`DonationLedger`, `CaseWorkflow`, `PeriodAnchor`, `EvidenceRegistry`, `ChainlinkFxAndAutomation`).
2. Deploy patched contracts cleanly via [deploy.js](../../blockchain/scripts/deploy.js) and update `shared/abis/` + deployed address environment configuration (`VITE_CASE_WORKFLOW_ADDRESS`). Historical anchored commitments on prior deployments remain permanently verifiable.
