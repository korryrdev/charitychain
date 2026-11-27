# Backup, Restore & Cryptographic Post-Restore Verification

Database and IPFS recovery follow [backup-policy.md](../../infrastructure/backups/backup-policy.md), [restore-procedure.md](../../infrastructure/backups/restore-procedure.md), [verification-checklist.md](../../infrastructure/backups/verification-checklist.md), and [database-recovery.md](../../infrastructure/runbooks/database-recovery.md).

---

## 1. What Must Be Backed Up

1. **PostgreSQL 17 Database (`charitychain_postgres_data`):** Complete ACID state across all 86 tables, Prisma migration history, SQL immutability triggers, and `OutboxEvent` rows.
2. **IPFS Kubo Datastore (`charitychain_ipfs_data`):** Encrypted evidence CIDs pinned locally when running self-hosted Kubo (`http://localhost:5001`).
3. **Secrets & Wrapping Keys (Out-of-Band Encrypted Vault):** `ENCRYPTION_KEY`, `SESSION_SECRET`, `REF_HASH_SECRET`, and `BLOCKCHAIN_SERVICE_PRIVATE_KEY` (restoring an encrypted DB or IPFS backup without `ENCRYPTION_KEY` renders ciphertext evidence unrecoverable).

---

## 2. Backup & Restore Commands (Docker Compose Example)

```bash
# Backup logical SQL dump (consistent snapshot)
docker exec charitychain-postgres pg_dump -U charitychain -Fc charitychain > charitychain_backup.dump

# Restore into a fresh PostgreSQL instance
docker exec -i charitychain-postgres pg_restore -U charitychain -d charitychain --clean --if-exists < charitychain_backup.dump
```

---

## 3. Post-Restore Integrity Checks

After any restore:
1. Verify Prisma migration & schema state (`npm run db:validate` and `npm run test -w @charitychain/database`).
2. Confirm append-only SQL triggers exist on `case_events`, `allocations`, and `donation_raw_callbacks` (`database/tests/constraints.test.js`).
3. Recompute the restored UTC day's Merkle root via `GET /api/v1/public/digest/:day` and compare against the immutable `PeriodAnchor.dailyRoot(day)` on Polygon/Hardhat to confirm zero rollback tampering (`R17`).
4. Verify API readiness (`GET /api/v1/health/ready`).
