# Non-Functional Requirements

Derived from [Product Requirements Document §16](./product-requirements-document.md#16-non-functional-requirements) and verified against the unified system architecture.

---

| Quality Attribute | Target / Specification | Implementation Evidence |
| --- | --- | --- |
| **Availability & Callback Resilience** | Public trace endpoints `>= 99%` uptime; payment callbacks respond fast without dropping notifications. | `/api/v1/health/live` & `/api/v1/health/ready` health probes; Daraja C2B writes raw payload + lot + outbox atomically before returning `200`, deferring on-chain RPC anchoring asynchronously. |
| **Performance** | API reads `p95 < 300 ms`; mobile-first initial public load lightweight on 3G networks. | Vite 8 bundle splitting (`2,706` transformed modules), indexed PostgreSQL Prisma queries, cached public dashboard statistics. |
| **Data Integrity & Financial Accuracy** | Zero floating-point rounding drift; append-only financial audit history. | All monetary values stored as integer minor units (`BigInt` / `Int`, `money.js`); PostgreSQL `BEFORE UPDATE OR DELETE` triggers block mutations on `case_events`, `allocations`, and `donation_raw_callbacks`; hash-chained `AuditEvent`. |
| **Reliability & Idempotency** | No duplicate donations/anchors on retries or outbox crashes. | Unique constraints on M-Pesa transaction IDs and `OutboxEvent` idempotency keys; HTTP `Idempotency-Key` middleware (`idempotency.js`); `FOR UPDATE SKIP LOCKED` / backoff retry worker (`outboxProcessor.js`). |
| **Security & Segregation** | No plaintext PII on-chain or on public endpoints; admins cannot unilaterally disburse funds. | Keyed HMAC `donorRef`, encrypted off-chain student PII, AES-256-GCM encrypted IPFS receipts, `canApproveOrDisburseFunds()` guard (`roles.js`), TOTP MFA for `COMMITTEE_MEMBER`/`TREASURER`/`SIGNATORY`, Helmet CSP, CSRF protection, rate limiting. |
| **Privacy & Inference Protection** | No donor exposure on public wall (`FR-DON-12`). | `ANONYMOUS` default, k-anonymity `>= 5` on `anonymousDonorsCount`, zero amounts/exact dates on `/api/v1/public/recognition`, preview-before-publish & automated screening. |
| **Observability** | Traceable logs across API, database, workers, and chain anchors. | Pino structured JSON logger with `X-Request-Id` correlation (`requestCorrelation.js`), readiness dependency checks (`database: ok`), chain lag & reconciliation monitoring. |
| **Portability & Zero-Spend Deployment** | Full local stack reproducible via Docker Compose + Testnet. | `docker-compose.yml` (`postgres:17-alpine`, `ipfs/kubo:v0.39.0`, backend, Nginx frontend), Hardhat local `31337` + Polygon Amoy `80002`, Daraja Sandbox. |
| **Browser Support & Localization** | Modern desktop & mobile browsers; English (`en`) & Swahili (`sw`); EAT display with UTC storage. | `I18nContext.tsx`, `@fontsource/plus-jakarta-sans` & `@fontsource/inter`, dual `data-theme`/`.dark` tokens, Tailwind v4 cascade-safe styles. |
| **Maintainability & Quality Gates** | Clean lint, type-check, schema, build, and automated regression suite. | Shared `@charitychain/shared` helpers, ESLint (`--max-warnings=0`), `tsc --noEmit`, Solidity `0.8.28`, 284 automated tests across 5 workspaces. |
