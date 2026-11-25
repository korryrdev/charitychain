# Secrets & Key Management Policy

No private keys, database passwords, session secrets, or payment gateway credentials may ever be committed to Git. All configuration uses the ignored repository-root `.env` file modeled after [.env.example](../../.env.example).

---

## 1. Secret Classification

| Variable Group | Variables | Sensitivity & Custody Rules |
| --- | --- | --- |
| **Application & Encryption Keys** | `SESSION_SECRET`, `ENCRYPTION_KEY`, `REF_HASH_SECRET` | High. `SESSION_SECRET` (`>= 32` random chars) signs sessions; `ENCRYPTION_KEY` (`32` bytes) protects sensitive student/beneficiary & IPFS keys; `REF_HASH_SECRET` computes one-way HMAC `donorRef` hashes and must never leave the backend. |
| **Database Credentials** | `POSTGRES_PASSWORD`, `DATABASE_URL` | High. Local compose uses port `5435`; production must use managed DB secrets over TLS and distinct credentials per environment. |
| **Safaricom Daraja & Banking** | `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_INITIATOR_NAME`, `MPESA_SECURITY_CREDENTIAL`, `MPESA_CALLBACK_SECRET`, `BANK_API_KEY`, `BANK_WEBHOOK_SECRET` | Critical in production. Kept `FEATURE_MPESA_ENABLED=false` unless sandbox/production credentials are explicitly provisioned. Never logged by Pino (`sensitiveDataRedactor.js`). |
| **Email & SMS Providers** | `RESEND_API_KEY`, `SMS_API_KEY`, `AT_SENDER_ID` | Medium-High. Development auto-verifies tokens locally without calling external providers unless enabled. |
| **Blockchain Relayer Key** | `BLOCKCHAIN_SERVICE_PRIVATE_KEY` | Medium (Non-custodial). Holds minimal native gas (`POL`) solely for notarization calls (`RELAYER_ROLE`). **Cannot authorize fund releases** without 2-of-3 committee signatory EIP-712 signatures. |
| **Signatory Private Keys** | *(None on server)* | Critical. Held exclusively inside each executive signatory's personal hardware/browser wallet (MetaMask) and never stored in `.env` or databases. |
| **Public Frontend Build Variables** | `VITE_API_BASE_URL`, `VITE_CASE_WORKFLOW_ADDRESS` | Public only. **Never prefix secrets with `VITE_`** because Vite bundles `VITE_*` variables into browser JavaScript. |

---

## 2. Key Rotation Guidelines

* Rotating `SESSION_SECRET` invalidates existing web sessions cleanly.
* Rotating `ENCRYPTION_KEY` uses `backend/src/security/keyVersions.js` so existing wrapped evidence keys remain decryptable during re-wrapping.
* Rotating `BLOCKCHAIN_SERVICE_PRIVATE_KEY` requires granting `RELAYER_ROLE` to the new address and revoking the old address from `DonationLedger`, `CaseWorkflow`, `PeriodAnchor`, and `ChainlinkFxAndAutomation` ([Incident Response](./incident-response.md)).
