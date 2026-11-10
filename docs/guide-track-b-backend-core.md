# Track B: Backend Core

**Folders you own:** `backend/` except `src/forensics`, `src/integrity`, `src/reports`, `src/simulator` (Track C), plus `backend/prisma/`
**You provide:** The REST API, the database, Daraja intake, the outbox and chain client, auth, evidence handling, the OpenAPI spec
**You consume:** ABIs and deployments from Track A, hashing and roles from `shared/`, events consumed by Track C

Read first: `ARCHITECTURE.md` sections 1, 3.2, 4, 5, 6, 8 and PRD sections 7, 10, 11, 14.

---

## 1. Mission

Be the trusted middle. Everything money related flows through you: you take payments from Daraja, enforce Malkia's approval rules, keep an append only record, and push fingerprints to the chain reliably. If you are correct and boring, the rest of the system can be clever.

---

## 2. Stack

- Node.js 20, TypeScript (strict), Fastify, `fastify-type-provider-zod`, `@fastify/swagger`
- PostgreSQL 16, Prisma (raw SQL migrations for triggers and views)
- pg-boss for queues and schedules
- Web3.js v4 for the relayer (behind the `ChainClient` interface)
- argon2 for passwords, `otplib` for TOTP, `jsonwebtoken` or `jose` for tokens
- pino for logs, `@fastify/rate-limit`, `@fastify/helmet`, `@fastify/cors`, `@fastify/cookie`
- Vitest and Supertest for tests, Testcontainers or a docker Postgres for integration tests

---

## 3. Folder layout

```
backend/
  prisma/
    schema.prisma
    migrations/            includes SQL for append-only triggers and forensics_read views
    seed.ts
  src/
    server.ts              builds the Fastify app
    worker.ts              starts outbox, jobs, listener (separate process)
    config.ts              Zod validated env
    lib/                   crypto.ts (HMAC, AES-GCM), ipfs.ts, errors.ts, logger.ts,
                           idempotency.ts, withAudit.ts, time.ts
    chain/                 ChainClient.ts, Web3ChainClient.ts, FakeChainClient.ts,
                           outbox.worker.ts, listener.ts, reconcile.job.ts
    jobs/                  queue setup, schedules
    modules/
      auth/ users/ daraja/ donations/ bank/ items/ inventory/
      cases/ disbursements/ evidence/ public/ audit/
```

Every module follows the shape in `ARCHITECTURE.md` 3.2 (`routes`, `service`, `repo`, `schema`, `events`, `index`).

---

## 4. Build order

### B1. Scaffold
Fastify app, config validation, pino with request ids, central error handler returning the shared error shape, health endpoint, CORS and helmet, Vitest, Dockerfile with `web` and `worker` commands.
**Done when:** `GET /health` works and an unknown route returns the standard error body.

### B2. Schema v0 and migrations (feeds IC0)
Prisma models for the tables in PRD 10.1. Raw SQL migration adding:
- triggers that reject UPDATE and DELETE on `audit_log`, `case_events`, `allocations`, `donation_raw_callbacks`
- the `forensics_read` schema with views and the `forensics_ro` role
- unique constraints: M-Pesa transaction id, outbox idempotency key, receipt code
**Done when:** a test proves an UPDATE on an append only table fails.

### B3. Auth and RBAC
Login with argon2, TOTP enrollment and verification, access token (short, in response body, kept in memory by the client) and rotating refresh token (httpOnly cookie), logout, lockout on repeated failures. RBAC guard built on `shared/roles`. Helper `assertSegregation(actorId, otherActorId)` used by services.
**Done when:** every route declares its required permission, and a test fails if a route has none.

### B4. Audit log
`withAudit(tx, event)` writes a hash chained audit entry using `shared/hashing` (canonical JSON, `prevHash`, `seq`). Every service write goes through it.
**Done when:** a test tampers with a stored row and the verifier script detects the break.

### B5. Chain client and outbox
- `ChainClient` interface (see `ARCHITECTURE.md` 8), `Web3ChainClient` and `FakeChainClient`.
- Outbox worker as in `ARCHITECTURE.md` 6.2: claim with `SKIP LOCKED`, send, wait for confirmations, mark confirmed, retry with backoff, dead letter after N attempts and raise an alert.
- Event listener turns chain events (including `IntegrityAlert`) into domain events.
- Nightly reconcile job: every `CONFIRMED` row must have a matching chain event.
**Done when:** killing the worker mid send and restarting results in exactly one on-chain record (test with the Hardhat node).

### B6. Daraja
- Register C2B URLs script, token path secret, IP allowlist from config.
- `POST /daraja/c2b/validation/:token` and `/confirmation/:token`.
- Store the raw body first, then in one transaction: parse, create donation and lot, audit entry, outbox row, emit `donation.recorded`. Idempotent on the M-Pesa transaction id.
- Respond within a second. Everything slow happens later.
- Job that calls Transaction Status for confirmations that look incomplete and alerts on mismatch.
- Do not rely on the phone number. Sandbox payloads may mask it. Use the receipt code for lookup.
- `infra/mock-daraja` (Track E builds it, you specify payloads) covers duplicates, late callbacks, malformed bodies.
**Done when:** a replayed callback creates no second donation and a malformed one is stored raw and rejected with a clear log.

### B7. Donations, bank, items, inventory
- Receipt code generator (high entropy, checksum, `MLK-XXXX-XXXX`).
- Bank deposit entry, maker-checker verification, FX capture (original and converted amounts with rate source).
- In-kind item log and inventory movements (received, issued).
- Lots with remaining balance and optional earmark.
**Done when:** a deposit cannot be verified by its own creator, and pool balance equals inflow minus outflow in a test.

### B8. Cases, approvals, signatures, disbursements
- Case state machine from PRD 10.2 enforced in the service (and mirrored on chain).
- Segregation of duties: submitter is not approver.
- `GET /cases/:id/authorization-request` returns the EIP-712 domain and message for the signatory to sign. `POST /cases/:id/authorize` verifies the signature server side, stores it, and when two distinct signatories have signed enqueues `authorizeRelease`.
- Disbursement: FIFO lot allocation honoring earmarks, write allocation lines, block above authorized amount, evidence required, enqueue `recordDisbursement`.
- Nightly invariant job for pool balance drift (feeds rule R16).
**Done when:** the full case flow works end to end against `FakeChainClient` and against the Hardhat node.

### B9. Evidence and IPFS
- Upload endpoint, AES-256-GCM encryption with a per file data key wrapped by `EVIDENCE_KEK`, store plaintext SHA-256, pin ciphertext to Pinata (or local or stub by `IPFS_MODE`), save the CID.
- Authorized download decrypts on the fly. Public evidence is explicit and rare.
**Done when:** a file pinned and fetched back has the same hash, and a non-privileged user cannot download it.

### B10. Public API
`GET /public/trace/:receipt`, `/public/stats`, `/public/reports`, `/public/digest/:day`. Rate limited, cached, no personal data, no beneficiary identity. Throttle receipt lookups per IP.
**Done when:** a security test asserts that no response from `/public/*` contains a phone number, name or beneficiary field.

### B11. OpenAPI and client contract
Generate `shared/openapi.json` in CI, commit it, fail CI on drift. Provide example responses for D's mocks.
**Done when:** D can generate a typed client and MSW handlers from it.

### B12. Hardening
Rate limits per route group, security headers, log redaction, request size limits, dependency audit, backup and restore notes, load smoke on public endpoints.
**Done when:** the Track E security checklist passes.

### B13. Donor privacy and recognition (groundwork in Phase 1, features in Phase 2)

**Phase 1 groundwork (do this with B6 and B7, it avoids a painful migration later):**
- `donor_profiles` (`donor_ref` unique, `display_mode` default `ANONYMOUS`, `alias`, `display_name` encrypted, `public_name_status`) and `donor_preference_events` (append only, with consent text version).
- Compute `donorRef` with `shared/hashing` in the Daraja handler, bank entry and item log, and store it on every donation. Raise `donation.reversed` when a reversal arrives.
- Never expose `donor_ref`, phone or name in any public response.
**Done when:** every donation has a donor reference and a test proves no public route returns it.

**Phase 2 features:**
- Claim flow: `POST /public/donor/claim` checks a receipt code and returns a short lived claim token. `GET /public/donor/me` and `PATCH /public/donor/preferences` use that token. Claiming several receipts links them to one profile. Rate limit and log every claim.
- Name approval belongs to the donor: the preferences endpoint first returns a preview and any screening failure, and the name goes live only when the donor confirms. Automatic screening covers an offensive word blocklist (English and Swahili), reserved words (Malkia, committee, admin, Safaricom and similar), and lookalikes of names already public. A failed screening keeps the donor anonymous with a clear reason.
- Takedown: a committee member can take down a public name with a required reason. The donor reverts to anonymous and is told why, and the action is logged. `POST /public/recognition/:id/report` lets visitors report a name (rate limited).
- Tier config: `badge_tiers` versioned, changes need a second committee approval and an audit entry.
- Totals: `donor_period_totals` per academic year and lifetime, built only from verified donations past the cooling period (default 7 days), minus reversals. In-kind counts when the committee confirms a value.
- `computeBadges(totals, tiers, asOf)` as a pure function in `modules/donors/badges.ts`, covering Bronze, Silver, Gold, lifetime Patron and Consistent giver (default 3 consecutive months). Runs nightly and on `donation.anchored` and `donation.reversed`. Writes `donor_badges`, an audit entry, and emits `badge.awarded` or `badge.removed`.
- `GET /public/recognition` built from an explicit allow list: display name, tier, month awarded. No amounts, no exact dates, no recent donations feed. Return the anonymous count only when it is 5 or more.
- Admin masking: `GET /donors/:ref` returns a masked reference. Revealing needs a permitted role and a stated reason, and is logged.
- Optional: thank-you certificate PDF with a verify link (stretch).
**Done when:** a leak test proves `/public/recognition` never contains amounts, exact dates or anonymous donors, `computeBadges` has table driven tests for every tier boundary and cooling period case, withdrawing consent or a committee takedown removes a donor from the wall immediately, and a name that fails screening never reaches `/public/recognition`.

---

## 5. Rules

- Routes stay thin. Rules live in services.
- One transaction per state change, with audit entry and outbox row inside it.
- Never call the chain inside an HTTP request. Always the outbox.
- Never import another module's repo.
- Never log personal data, tokens or keys. Redact by default.
- No UPDATE or DELETE on append only tables, even in tests. Add a compensating record.
- All money as `bigint` minor units. No floats anywhere.
- Every create endpoint that touches money accepts an `Idempotency-Key` header.
- Use the error codes in `shared/src/errors.ts`. Add new ones there.

---

## 6. Testing

| Level | What |
|---|---|
| Unit | Services with a fake repo: state machine, segregation, FIFO allocation math, receipt codes |
| Integration | Real Postgres: callbacks, outbox, triggers, audit chain, auth flows |
| Contract tests | Run the outbox against the Hardhat node with the real ABIs |
| Security | Authorization matrix test (every role against every route), public leak test |
| Load smoke | Public endpoints with autocannon or k6 |

---

## 7. Hand offs

| To | What | When |
|---|---|---|
| D | OpenAPI skeleton and mock scenarios | IC0 |
| C | `forensics_read` views and events list | IC0 |
| D and C | Donation and trace flow working locally | IC1 |
| D | Case and signing endpoints | Before IC2 |
| C | Disbursement and allocation data, reconcile job | Before IC3 |
| E | Dockerfile, env list, health checks | Before staging deploy |

---

## 8. Definition of done for the track

Every functional requirement under FR-INT, FR-CASE, FR-FLOW, FR-TRACE (server side), FR-AUD, FR-AUTH and FR-DON has a passing test, the outbox survives restarts, OpenAPI is committed and drift free, and the authorization matrix test is green.
