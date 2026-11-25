# API Surface Reference (`/api/v1`)

All HTTP endpoints are mounted under `/api/v1` via [registerRoutes.js](../../backend/src/bootstrap/registerRoutes.js) and [routes/index.js](../../backend/src/routes/index.js). State-changing money endpoints honor `Idempotency-Key`, responses include `X-Request-Id` for correlation, and list endpoints accept pagination parameters.

---

## 1. Health & Probes (`/api/v1/health`)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health/live` | Public | Returns `{ status: "ok", service: "charitychain-api" }`. |
| `GET` | `/api/v1/health/ready` | Public | Verifies PostgreSQL connectivity (`{ status: "ready", dependencies: { database: "ok" } }`, or `503`). |

---

## 2. Public Endpoints (`/api/v1/public`)

Mounted via `createPublicRouter` without session authentication (rate-limited per IP).

### 2.1 Public Authentication (`/api/v1/public/auth`)

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/public/auth/register` | Register a public donor account (`DONOR`). |
| `POST` | `/api/v1/public/auth/register-student` | Self-register with MUST student email (`name123456@students.must.ac.ke`). |
| `POST` | `/api/v1/public/auth/verify-account` | Confirm verification token. |
| `POST` | `/api/v1/public/auth/login` | Email + password sign-in (`{ user, token, mfaRequired, mfaVerified, ... }`). |
| `POST` | `/api/v1/public/auth/demo-login` | Seeded Malkia governance session helper (`/login`, local/demo mode). |
| `POST` | `/api/v1/public/auth/logout` | Terminate active session cookie. |
| `POST` | `/api/v1/public/auth/password-reset/request` | Initiate password reset. |
| `POST` | `/api/v1/public/auth/password-reset/complete` | Complete password reset. |
| `POST` | `/api/v1/public/auth/mfa/enable` | Enroll TOTP MFA secret & URI. |
| `POST` | `/api/v1/public/auth/mfa/verify` | Verify 6-digit TOTP MFA challenge. |

### 2.2 Public Trace, Dashboard, Recognition, Reports & Audit Export

| Method | Path | PRD / Spec | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/public/trace/:receipt` | `FR-TRACE-01`, `FR-TRACE-02` | Return lot state, FIFO allocations, redacted case categories, and Polygon proof for `MLK-XXXX-XXXX` or M-Pesa receipt. |
| `GET` | `/api/v1/public/stats` | `FR-TRACE-04` | Return pool balance, total inflow/outflow, category splits, and beneficiaries helped (zero PII). |
| `GET` | `/api/v1/public/reports` | `FR-REP-03` | List published quarterly reports with on-chain hash anchors. |
| `GET` | `/api/v1/public/digest/:day` | `FR-AUD-02` | Compute/return UTC daily ledger Merkle root (`YYYYMMDD` / ISO date). |
| `GET` | `/api/v1/public/digest/:day/proof/:eventId` | `G25` | Return Merkle inclusion proof for a specific `AuditEvent`. |
| `GET` | `/api/v1/public/audit/export` | `G34` | Paginated read-only export of hash-chained audit logs (`fromDate`, `toDate`, `page`, `pageSize`). |
| `POST` | `/api/v1/public/verify-proof` | `G36` | Verify a submitted Merkle inclusion proof payload. |
| `GET` | `/api/v1/public/chainlink/automation` | `G36`, `PRD §9.5` | Return Chainlink daily anchor & pool drift readiness telemetry. |
| `GET` | `/api/v1/public/certificate/:receipt` | `FR-DON-14`, `G37` | Return signed SVG thank-you certificate (`?format=svg` or JSON metadata). |
| `POST` | `/api/v1/public/donor/claim` | `FR-DON-04` | Prove control of a receipt code and receive a short-lived claim token. |
| `GET` | `/api/v1/public/donor/me` | `FR-DON-11` | Return private donor badge progress, yearly total, and display mode (requires claim token). |
| `PATCH` | `/api/v1/public/donor/preferences` | `FR-DON-05`, `FR-DON-06` | Preview, screen (English/Swahili/lookalikes), confirm, or withdraw `ANONYMOUS`/`ALIAS`/`NAMED` preference. |
| `GET` | `/api/v1/public/recognition` | `FR-DON-12` | Opted-in public recognition entries (no amounts/exact dates; `anonymousDonorsCount` only if `>= 5`). |
| `POST` | `/api/v1/public/recognition/:id/report` | `FR-DON-16` | Flag an abusive/impersonating public recognition entry for committee review. |
| `POST` | `/api/v1/public/crypto/stablecoin` | `G35` | Record testnet USDC/USDT stablecoin donation lot converted to KES minor units. |
| `*` | `/api/v1/public/{donors,donations,recognition,confirmations,goods-collections,transparency,reports}` | Portal public routes | Support public catalogue, confirmation tokens, and portal transparency pages. |

---

## 3. Daraja C2B & Payment Webhooks

See [Webhooks Specification](./webhooks.md) for security and payload rules.

* `POST /api/v1/daraja/c2b/validation/:token` — Safaricom C2B validation check
* `POST /api/v1/daraja/c2b/confirmation/:token` — Tokenized C2B confirmation creating `DonationRawCallback` + `DonationLot` + `OutboxEvent`
* `POST /api/v1/webhooks/payments/*` — Bank/generic payment provider callbacks
* `POST /api/v1/webhooks/payments/mpesa/*` — Daraja STK Push, B2C, B2B, and Transaction Status callbacks
* `POST /api/v1/webhooks/disbursements/*` — Disbursement provider completion webhooks

---

## 4. Authenticated Routes (`/api/v1/*`)

Every router below passes through `authenticate` (cookie or Bearer session), `auditContext`, `csrfProtection` (on mutations), and per-route `authorize(permission)`:

### 4.1 Malkia PRD Case, Bank, Item, Forensics & Donor Endpoints

| Area | Base Path | Key Endpoints |
| --- | --- | --- |
| **Cases & Signing** | `/api/v1/cases` | `GET /subgroups`, `GET /`, `POST /`, `GET /:id`, `POST /:id/submit`, `POST /:id/decision`, `POST /:id/authorize` (incremental & batch 2-of-3 EIP-712), `POST /:id/disburse` |
| **Bank & CSV Recon** | `/api/v1/donations/bank` | `GET /`, `POST /`, `POST /:id/verify` (`!=` creator), `POST /statements/import`, `GET /reconciliation` |
| **In-Kind Items** | `/api/v1/donations/items`, `/api/v1/inventory/issue` | `GET /`, `POST /` (log `ITM` gift), `POST /issue` (issue stock to case) |
| **Forensic Alerts & DAG** | `/api/v1/alerts` | `GET /` (status/severity/rule filters), `GET /:id`, `POST /:id/resolve`, `POST /scan`, `GET /rules`, `PATCH /rules/:id`, `GET /graph` (5-column DAG) |
| **Reports** | `/api/v1/reports` | `GET /`, `POST /quarterly`, `GET /:id` |
| **Donor Portal** | `/api/v1/donor` | `GET /dashboard`, `POST /claim`, `PATCH /settings` |
| **Audit Trail** | `/api/v1/audit`, `/api/v1/audit-logs` | `GET /`, `GET /events`, `POST /events`, `GET /events/export`, `GET /integrity` |

### 4.2 Campus Operations & Administration Endpoints

All mounted under `/api/v1/`:
* `/users` (`GET /me`, `POST /`, `POST /staff`, `PATCH /:id/roles`, account lifecycle) & `/roles` & `/sessions`
* `/donors`, `/donations`, `/payments`, `/physical-donations`, `/confirmations`
* `/inventory` (batches, inspections, reservations, stock counts) & `/goods-collections`
* `/students`, `/university-records`, `/applications`, `/vetting`
* `/committee`, `/approvals`, `/disbursements`, `/reconciliation`
* `/evidence`, `/blockchain-audit`, `/forensics`, `/public-profile`, `/recognition`
* `/notifications`, `/complaints`, `/administration`
