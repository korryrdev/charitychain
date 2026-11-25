# Threat Model & Security Controls

CharityChain's security architecture assumes both external attackers and compromised internal operator credentials are possible, enforcing defense-in-depth across PostgreSQL, Express 5, IPFS, and Polygon contracts ([PRD §14](../requirements/product-requirements-document.md#14-security-and-threat-model)).

---

## 1. Protected Assets

1. **Ledger & Financial Integrity:** Accuracy of pooled inflows (`DonationLot`), FIFO allocations (`LotAllocation`), case decisions, and disbursements.
2. **Confidentiality of Student & Donor Identity:** Campus student identities/fee records (`MUST/SIM/2026/*`, encrypted `MalkiaCase` PII), donor phone numbers (`donorRef`), and encrypted IPFS evidence.
3. **Key Material:** Committee signatory wallets (resident exclusively in browser wallets/MetaMask), backend relayer key, session signing secret, HMAC `donorRef` secret, `ENCRYPTION_KEY`, and Daraja credentials.
4. **Public Service Availability:** Unauthenticated `/trace` and `/api/v1/public/*` endpoints without leaking protected records.

---

## 2. Threats, Attack Scenarios & Implemented Controls

| Threat | Example Attack | Implemented Mitigations |
| --- | --- | --- |
| **Spoofed Daraja / Payment Webhook** | Attacker POSTs fake payment confirmation to mint phantom donation lots. | Secret path token (`/daraja/c2b/confirmation/:token`), Zod schema validation, transaction-ID uniqueness, active STK/Transaction Status verification (`R06`). |
| **Callback Replay** | Duplicate Daraja webhook replays attempt to double-credit pool balance. | Database unique constraint on external provider transaction ID + idempotent raw callback ingestion (`FR-INT-03`, `callbackDeduplicator.js`). |
| **Insider DB Tampering** | Compromised operator/admin executes SQL `UPDATE` or `DELETE` on past disbursements/allocations. | PostgreSQL `BEFORE UPDATE OR DELETE` triggers (`case_events_append_only`, `allocations_append_only`, `donation_raw_callbacks_append_only`), hash-chained `AuditEvent`, `PeriodAnchor` daily Merkle root + rule `R17`. |
| **Self-Approval or Collusion** | Same user submits and approves a case, or verifies own bank deposit. | Code-enforced segregation (`assertSegregation`), forensic rules `R03`, `R04`, and `R10`, plus `canApproveOrDisburseFunds()` blocking `SYSTEM_ADMIN` and `AUDITOR`. |
| **Compromised Relayer Key** | Attacker gains `RELAYER_ROLE` private key and submits unauthorized release. | **Blocked by `CaseWorkflow.sol`:** `authorizeRelease` requires 2 distinct EIP-712 `SIGNATORY_ROLE` signatures; relayer key only calls non-custodial notarizations and can be paused/rotated cleanly. |
| **Single Signatory Wallet Theft** | One signatory key is compromised. | **2-of-3 EIP-712 quorum** (`SignatoryRegistry.verifyTwoOfThree`), per-case nonces, signature expiry deadlines, and 2-of-3 governance key rotation. |
| **Receipt Code Enumeration** | Automated guessing of `MLK-XXXX-XXXX` codes on `/trace` or `/claim`. | High-entropy random receipt generator (`receiptCode.js`), Express IP rate limiting (`rateLimit.js`), zero PII on trace responses. |
| **Beneficiary Exposure via IPFS / UI** | Public IPFS CID reveals student receipt or fee statement. | Client/server AES-256-GCM encryption prior to IPFS pinning (`evidenceEncryption.service.js`), redacted case categories on `/trace`, role-gated decryption. |
| **Inference Attack on Recognition Wall** | Correlating timestamps, amounts, or small anonymous cohort counts on `/wall`. | **k-anonymity (`>= 5`)** hiding `anonymousDonorsCount` below 5, zero amounts/exact dates/live feeds on `GET /api/v1/public/recognition`, `ANONYMOUS` default. |
| **Abusive / Impersonating Public Alias** | Bad actor registers `"Malkia Admin"` or offensive name on `/claim`. | Automated screening (`nameScreening.js`: English/Swahili blocklist, reserved words, leetspeak lookalikes), donor preview confirmation, visitor report + logged committee takedown (`FR-DON-16`). |
| **Account Takeover** | Credential phishing against committee chair, treasurer, or signatory. | Mandatory TOTP MFA (`COMMITTEE_MEMBER`, `TREASURER`, `SIGNATORY`), HTTP-only cookies, CSRF token binding (`csrfProtection.js`), account lockouts (`MAX_LOGIN_ATTEMPTS=5`). |
| **XSS, SQLi & Header Injection** | Malicious text in justification/appeal forms. | Parameterized Prisma queries, Zod input schemas, Helmet CSP security headers, explicit error mapping hiding raw stack traces. |
| **Blockchain RPC Outage / Reorg** | Anchor transaction dropped or delayed on Polygon Amoy. | Outbox retry queue with exponential backoff (`outboxProcessor.js`) and confirmation depth checks (`BLOCKCHAIN_CONFIRMATIONS`). |
| **Frontend Contract Spoofing** | UI tricks signatory into signing for attacker-owned contract. | Contract addresses and ABIs sourced from deployment manifests (`VITE_CASE_WORKFLOW_ADDRESS`) and `shared/abis/`; EIP-712 prompt displays verifying contract, chain ID, case ID, and minor-unit amount transparently. |
