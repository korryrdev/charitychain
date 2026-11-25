# API Error Envelope & Error Codes

All `/api/v1` error responses pass through [errorHandler.js](../../backend/src/middleware/errorHandler.js) and reference standardized machine codes defined in [errorCodes.js](../../backend/src/errors/errorCodes.js).

---

## 1. Standard Error Response Shape

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Human-readable explanation without leaking stack traces or secrets.",
    "requestId": "5aa1e0d8-32f8-40fc-ae90-4a3d4a1b3ee9",
    "details": {}
  }
}
```

Every HTTP response also carries the `X-Request-Id` header matching structured Pino log records on the server.

---

## 2. Canonical Error Code Catalogue (`42` Codes)

### General, Request & Rate Limiting

| Code | Typical HTTP Status | Meaning |
| --- | --- | --- |
| `INTERNAL_SERVER_ERROR` | `500` | Unhandled server error (stack masked in response). |
| `ROUTE_NOT_FOUND` | `404` | No matching `/api/v1` route (`notFound.js`). |
| `RESOURCE_NOT_FOUND` | `404` | Requested entity ID or receipt does not exist. |
| `VALIDATION_FAILED` | `400` / `422` | Zod request body, query, or params validation failed (`validateRequest.js`). |
| `CONFLICT` | `409` | State transition or unique constraint violation (e.g., self-approval, ceiling exceeded). |
| `RATE_LIMIT_EXCEEDED` | `429` | IP or endpoint throttling triggered (`rateLimit.js`). |
| `IDEMPOTENCY_CONFLICT` | `409` | Same `Idempotency-Key` reused with a different request payload. |
| `IDEMPOTENCY_IN_PROGRESS` | `409` | Concurrent duplicate mutation with the same `Idempotency-Key` still executing. |

### Authentication, Session & Access Control

| Code | Typical HTTP Status | Meaning |
| --- | --- | --- |
| `AUTHENTICATION_REQUIRED` | `401` | Missing or expired session cookie / Bearer token. |
| `INVALID_CREDENTIALS` | `401` | Email or password verification failed. |
| `ACCOUNT_NOT_VERIFIED` | `403` | Account verification token has not yet been confirmed. |
| `ACCOUNT_LOCKED` | `423` / `403` | Account locked after exceeding `MAX_LOGIN_ATTEMPTS` or suspended by admin. |
| `SESSION_EXPIRED` | `401` | Session exceeded TTL or idle timeout (`SESSION_IDLE_TIMEOUT_MINUTES`). |
| `MFA_REQUIRED` | `403` | Privileged role (`COMMITTEE_MEMBER`, `TREASURER`, `SIGNATORY`) requires TOTP MFA. |
| `MFA_INVALID` | `401` | Invalid TOTP verification code. |
| `FORBIDDEN` | `403` | Authenticated actor barred from action (e.g., `SYSTEM_ADMIN` / `AUDITOR` approval guard). |
| `PERMISSION_DENIED` | `403` | Actor lacks required permission from `permissions.js`. |

### Donations, Payments & Callbacks

| Code | Typical HTTP Status | Meaning |
| --- | --- | --- |
| `DONATION_NOT_FOUND` | `404` | Monetary or physical donation record not found. |
| `DONATION_STATE_CONFLICT` | `409` | Action invalid for current donation status (e.g., double verification). |
| `PAYMENT_FAILED` | `402` / `502` | Payment provider rejected transaction. |
| `PAYMENT_PENDING` | `202` / `409` | Provider settlement still in flight. |
| `PAYMENT_DUPLICATE` | `409` | Duplicate provider reference detected. |
| `CALLBACK_INVALID` | `400` / `401` | Webhook failed token/signature/schema verification. |
| `CALLBACK_DUPLICATE` | `200` / `409` | Replayed provider callback rejected or short-circuited safely. |
| `CONFIRMATION_INVALID` | `400` | Physical goods/handover confirmation token invalid or actor mismatch. |
| `CONFIRMATION_EXPIRED` | `410` / `400` | Confirmation link expired prior to Yes/No response. |

### Students, Vetting, Approvals, Disbursements & Inventory

| Code | Typical HTTP Status | Meaning |
| --- | --- | --- |
| `STUDENT_NOT_FOUND` | `404` | Student or simulated university registration number not found. |
| `STUDENT_INELIGIBLE` | `403` / `409` | Student failed policy or goods-collection eligibility checks. |
| `APPLICATION_NOT_FOUND` | `404` | Application or `MalkiaCase` not found. |
| `APPLICATION_DUPLICATE` | `409` | Duplicate active aid application in same academic semester. |
| `APPLICATION_STATE_CONFLICT` | `409` | Invalid workflow transition (or self-approval / non-signatory error). |
| `VETTING_FAILED` | `422` | Automated Need-Index evaluation blocked or errored. |
| `APPROVAL_DUPLICATE` | `409` | Signatory/committee member already signed this round. |
| `APPROVAL_CONFLICT` | `409` | Conflict of interest or segregation violation (`creator === approver`). |
| `APPROVAL_THRESHOLD_NOT_MET` | `409` | Release requested before 2 distinct signatories authorized it. |
| `DISBURSEMENT_FAILED` | `409` / `502` | Amount exceeds authorized ceiling (`FR-CASE-07`) or payout failed. |
| `INVENTORY_UNAVAILABLE` | `409` | Requested stock batch unavailable or insufficient balance. |
| `COLLECTION_LIMIT_EXCEEDED` | `409` | Exceeded per-category or max-category student collection limit. |
| `RECONCILIATION_MISMATCH` | `409` | Statement or bank/M-Pesa amount discrepancy flagged (`R06`, `R07`). |
| `INTEGRATION_UNAVAILABLE` | `503` | Upstream database, IPFS, RPC, or Daraja check unreachable. |
| `INTEGRATION_RESPONSE_INVALID` | `502` | External provider returned malformed data. |
