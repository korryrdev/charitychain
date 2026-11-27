# Trust Boundaries & Independent Verification Model

CharityChain partitions trust strictly so compromise of any single client, operator account, or web server cannot secretly rewrite donation or disbursement history ([PRD §5 & §14](../requirements/product-requirements-document.md#5-key-design-decisions)).

---

## 1. Trust Zones

```mermaid
flowchart TB
  subgraph UntrustedClient["Zone 1: Unauthenticated Public Browser"]
    PUB["Public Visitor / Donor (/trace, /wall, /claim)"]
  end

  subgraph AuthClient["Zone 2: Authenticated Staff & Signatory Wallets"]
    STAFF["Role Portals + CSRF Cookie"]
    WALLET["MetaMask Wallet (Signatory Private Keys Stay Here)"]
  end

  subgraph ApiZone["Zone 3: Application Server & Relayer (Express 5)"]
    API["RBAC, Better-Auth, CSRF, AES-256-GCM, Keyed HMAC"]
    RELAYER["Relayer Key (Can Record Notarizations, CANNOT Authorize Payouts)"]
  end

  subgraph DataZone["Zone 4: Append-Only Postgres & Encrypted IPFS"]
    DB[("PostgreSQL Triggers: Block UPDATE/DELETE")]
    IPFS[("IPFS Kubo: Ciphertext Evidence")]
  end

  subgraph TrustAnchor["Zone 5: Public Blockchain & Oracles"]
    CHAIN["Polygon Amoy (80002) / Localhost (31337)"]
    CL["Chainlink FX Feed & Automation"]
  end

  PUB -->|Rate-limited HTTPS (No PII returned)| API
  PUB -.->|"Direct RPC eth_call (Zero trust in API)"| CHAIN
  STAFF -->|HttpOnly Session + CSRF + TOTP 2FA| API
  WALLET -->|EIP-712 Typed Signature Only| STAFF
  API --> DB
  API --> IPFS
  RELAYER --> CHAIN
  CL --> CHAIN
```

---

## 2. Boundary Controls

| Boundary Crossing | Protection Mechanism | Residual Risk & Mitigation |
| --- | --- | --- |
| **Zone 1 -> Zone 3** (`/api/v1/public/*`, `/daraja/*`) | Rate limits, Zod validation, high-entropy `MLK-XXXX-XXXX` codes, explicit output allowlists (no PII/donor phones), tokenized Daraja callbacks, `Idempotency-Key`. | Receipt enumeration throttled per IP; leaked receipt reveals only anonymized need category and allocation lines. |
| **Zone 1 -> Zone 5** (`/trace` "Verify Direct on Chain") | Browser executes `Web3.js` `eth_call` directly against public RPC and recomputes `hashDonation(...)` client-side. | Eliminates blind trust in CharityChain backend: if DB history were altered (`R17`), client hash verification fails red immediately. |
| **Zone 2 -> Zone 5** (`/committee/signing`) | Signatories hold private keys exclusively in MetaMask; sign EIP-712 `ReleaseAuthorization` (`"CharityChain CaseWorkflow"` v1) with per-case nonces and deadlines. | Compromise of 1 signatory wallet cannot release funds (2-of-3 required); signatory rotation via `SignatoryRegistry`. |
| **Zone 3 -> Zone 5** (Relayer Wallet) | Relayer holds minimal gas balance for `DonationLedger`, `PeriodAnchor`, and `EvidenceRegistry` anchoring and **lacks permission to forge 2-of-3 signatory signatures**. | Stolen relayer key can only enqueue paused/invalid notarizations; rotate key & pause contract via `PAUSER_ROLE`. |
| **Zone 3 -> Zone 4** (PostgreSQL & IPFS) | `BEFORE UPDATE OR DELETE` SQL triggers on `case_events`, `allocations`, and `donation_raw_callbacks`; hash-chained `AuditEvent`; AES-256-GCM encryption before IPFS upload. | Even a rogue API process cannot issue `UPDATE`/`DELETE` on protected financial audit rows without triggering DB errors and `R17` digest alerts. |
