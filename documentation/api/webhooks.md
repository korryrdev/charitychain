# Webhooks & Safaricom Daraja Callback Specification

CharityChain ingests real-time mobile money and payout provider events through hardened, idempotent webhook routes mounted in [routes/index.js](../../backend/src/routes/index.js) and [daraja.routes.js](../../backend/src/modules/daraja/daraja.routes.js).

---

## 1. Endpoints

| Integration | Method & Path | Security Checks | Handler |
| --- | --- | --- | --- |
| **Daraja C2B Validation** | `POST /api/v1/daraja/c2b/validation/:token` | Secret `:token` path validation + `darajaC2bPayloadSchema` Zod schema | `daraja.service.js` (`handleValidation`) |
| **Daraja C2B Confirmation** | `POST /api/v1/daraja/c2b/confirmation/:token` | Secret `:token` validation + Zod schema + unique external tx constraint | `daraja.service.js` (`handleConfirmation`) |
| **M-Pesa STK / B2C / B2B** | `POST /api/v1/webhooks/payments/mpesa/*` | `callback.validation.js` + `callbackDeduplicator.js` + `mpesaResultCodes.js` | `integrations/mpesa/callback.controller.js` |
| **Bank Webhooks** | `POST /api/v1/webhooks/payments/*` | `bankWebhook.validation.js` + secret verification | `integrations/bank/bankWebhook.controller.js` |
| **Disbursement Callbacks** | `POST /api/v1/webhooks/disbursements/*` | Provider callback reference & reconciliation check | `modules/disbursements/disbursements.routes.js` |

*(Webhook & `/api/v1/daraja/` routes are CSRF-exempt because external payment gateways invoke them server-to-server, and instead enforce tokenized routes, replay protection, and asynchronous provider status verification.)*

---

## 2. Daraja C2B Ingestion Invariants (`FR-INT-01`..`04`)

1. **Raw Payload First (`DonationRawCallback`):** Every incoming callback JSON payload is inserted into PostgreSQL before business allocation. `donation_raw_callbacks` is protected by trigger `donation_raw_callbacks_append_only` (`BEFORE UPDATE OR DELETE`).
2. **Idempotent Replay Handling (`FR-INT-03`):** Duplicate notifications sharing the same external `TransID` / M-Pesa receipt code return `200 OK` without provisioning a second `DonationLot`.
3. **Keyed Donor Privacy (`D3`, `D9`):** Raw `MSISDN` or masked Daraja phone strings are normalized and passed through `HMAC_SHA256(secret, "malkia:v1:donor:" + identity)` (`donorReference.js`). No plaintext donor phone number or name is written on-chain or exposed publicly.
4. **Receipt Code & Atomic Outbox:** Within the same database transaction, the backend provisions a `DonationLot` (`remainingMinor`), generates `MLK-XXXX-XXXX` (`receiptCode.js`), logs an `AuditEvent`, and inserts an `OutboxEvent` to notify `DonationLedger.sol`.

---

## 3. M-Pesa Result-Code Classification & Active Querying

For STK Push (`stkPush.adapter.js`, `stkPushQuery.adapter.js`), B2C upkeep, and B2B university Paybill payouts:
* Result codes are explicitly classified via [mpesaResultCodes.js](../../backend/src/integrations/mpesa/mpesaResultCodes.js) (distinguishing confirmed settlements from user cancellation, timeout, insufficient balance, or destination mismatch).
* Pending or ambiguous callbacks trigger scheduled STK Push Query / Transaction Status checks (`transactionStatus.adapter.js`); any mismatch between provider status and the ledger triggers forensic rule `R06`.
