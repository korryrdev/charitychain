# System Monitoring, Health Probes & Observability

Operational telemetry and alerting configuration live alongside [healthchecks.yml](../../infrastructure/monitoring/healthchecks.yml) and [alerts.yml](../../infrastructure/monitoring/alerts.yml).

---

## 1. HTTP Health Endpoints

| Probe | Endpoint | Expected Response | Purpose |
| --- | --- | --- | --- |
| **Liveness** | `GET /api/v1/health/live` | `200 {"status":"ok","service":"charitychain-api"}` | Verifies Express 5 event loop responsiveness. |
| **Readiness** | `GET /api/v1/health/ready` | `200 {"status":"ready","dependencies":{"database":"ok"}}` | Verifies PostgreSQL query roundtrip (`5,000 ms` timeout; returns `503 INTEGRATION_UNAVAILABLE` if unreachable). |
| **Chainlink & Digest Readiness** | `GET /api/v1/public/chainlink/automation` | `200` JSON telemetry | Exposes daily digest anchor status and pool-drift check health (`G36`). |

---

## 2. Structured Logging & Request Correlation

* Implemented via Pino (`backend/src/observability/logger.js` & `requestCorrelation.js`).
* Every HTTP response echoes `X-Request-Id`, matching the structured JSON log lines containing `req.id`, `method`, `url`, `res.statusCode`, and `responseTime`.
* Sensitive tokens, passwords, phone numbers, and secrets are filtered by `backend/src/security/sensitiveDataRedactor.js`.

---

## 3. Operational Outage Runbooks

* M-Pesa Daraja gateway timeouts/outages: [mpesa-outage.md](../../infrastructure/runbooks/mpesa-outage.md)
* SMS notification gateway failures: [sms-outage.md](../../infrastructure/runbooks/sms-outage.md)
* Super Admin runtime integration overview: `/admin/integrations`
