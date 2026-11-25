# Security Incident Response & Operational Runbooks

These step-by-step runbooks address high-severity security and integrity events (`PRD §18` / `PRD §14.2`).

---

## Runbook 1: Emergency Smart Contract Pause
**Trigger:** Suspected relayer key leak, compromised upstream gateway, or abnormal on-chain writes.
1. Invoke `pause()` from an authorized `PAUSER_ROLE` admin wallet on affected contracts (`CharityChainAccess` subclasses, `DonationLedger`, `CaseWorkflow`, `PeriodAnchor`, `ChainlinkFxAndAutomation`).
2. Verify all write functions (`recordDonation`, `submitCase`, `authorizeRelease`, `anchorDaily`, `performUpkeep`) revert while paused.
3. Pause automated outbox workers (`FEATURE_BLOCKCHAIN_ANCHORING_ENABLED=false`) and notify operators via `/admin/security`.

## Runbook 2: Rotating a Compromised Relayer Key
**Trigger:** Leak of `BLOCKCHAIN_SERVICE_PRIVATE_KEY`.
1. Generate a fresh relayer keypair in a secure host vault and fund it with minimal testnet `POL` for gas.
2. Using `DEFAULT_ADMIN_ROLE`, call `grantRole(RELAYER_ROLE, newRelayer)` (and `grantRole(SYSTEM_WRITER_ROLE, newRelayer)` on `EvidenceRegistry`) across contracts.
3. Call `revokeRole(..., oldRelayer)` on every contract.
4. Update `BLOCKCHAIN_SERVICE_PRIVATE_KEY` in production secret storage, restart backend workers, and inspect on-chain events between compromise and revocation for unauthorized notarizations.

## Runbook 3: Rotating an Executive Signatory Wallet (`SignatoryRegistry`)
**Trigger:** Lost hardware wallet or compromised signatory device.
1. Convene the **two remaining uncompromised signatories** (`SIGNATORY_ROLE`).
2. Collect 2 distinct EIP-712 signatures authorizing `SignatoryRegistry.removeSignatory(compromisedWallet, signatures)` followed by `SignatoryRegistry.addSignatory(newSignatoryWallet, signatures)`.
3. Revoke active dashboard sessions for the affected user in `/admin/users` and require fresh TOTP MFA setup + wallet challenge link (`FR-AUTH-02`).

## Runbook 4: Database-vs-Chain Merkle Digest Mismatch (`Rule R17`)
**Trigger:** `ChainlinkFxAndAutomation` / `dailyDigest` verification detects `observedRoot !== PeriodAnchor.dailyRoot(day)`.
1. Lock non-essential exports and pause payouts via `/admin/security`.
2. Export immutable audit stream (`GET /api/v1/public/audit/export`) and inspect the PostgreSQL `audit_log` chain (`prevHash` continuity) for the affected UTC day.
3. Confirm trigger integrity on `case_events`, `allocations`, and `donation_raw_callbacks` (`database/tests/constraints.test.js`).
4. Isolate tampered/corrupted records, restore verified DB snapshot if host compromise occurred ([Backup and Restore](../operations/backup-and-restore.md)), and file an incident investigation in `/auditor/anomalies`.

## Runbook 5: Abusive Public Recognition Name Takedown (`FR-DON-16`)
**Trigger:** Visitor reports an offensive/impersonating public alias (`POST /api/v1/public/recognition/:id/report`).
1. Committee member with `recognition:moderate` opens the flagged entry and records a mandatory takedown reason.
2. Backend immediately resets the donor's public `displayMode` to `ANONYMOUS` (removing it from `/wall`) and logs an immutable `AuditEvent` notifying the donor.

## Runbook 6: Stuck Outbox / Webhook Recovery
**Trigger:** `OutboxEvent` rows accumulate in `PENDING`/`FAILED` due to RPC congestion or Daraja timeouts.
1. Inspect `/admin/integrations` and RPC health (`POLYGON_RPC_URL`).
2. Confirm idempotency keys are intact; allow `outboxProcessor.js` exponential backoff to drain once RPC recovers, or query M-Pesa Transaction Status (`transactionStatus.adapter.js`) for uncertain payment callbacks.
