# C4 Level 1: System Context

This view frames CharityChain's external actors, payment/drop-off rails, storage/oracle integrations, and public blockchain boundary as defined in [Product Requirements Document §8.1](../requirements/product-requirements-document.md#81-system-context).

```mermaid
flowchart LR
  subgraph ExternalActors[External Actors & Donors]
    D1["Local Donor<br/>M-Pesa Paybill / STK"]
    D2["International Donor<br/>Bank Transfer / Testnet Stablecoin"]
    D3["In-Kind Donor<br/>Hospital Pharmacy / Desk"]
    STU["Campus Student (MUST)<br/>Aid & Goods Applicant"]
    STAFF["Internal Staff & Governance<br/>Clerk, Committee, 3 Signatories, Finance, Auditor, Admin"]
  end

  D1 -->|Paybill / STK Push| SAF["Safaricom Daraja API"]
  D2 -->|SWIFT / Local Bank / ERC20 Ref| BANK["Central Bank Account"]
  D3 -->|Physical Drop-Off| DESK["Clerk / Pharmacy Desk"]

  SAF -->|C2B & STK Webhooks| CC
  BANK -->|Treasurer Entry & CSV Statement| CC
  DESK -->|Mobile / Desk Log + Confirmation| CC
  STU -->|Applications, Goods Requests, Appeals| CC
  STAFF -->|RBAC Portals & MetaMask EIP-712| CC

  subgraph CC[CharityChain Platform]
    WEB["React 19 Web App (Port 5173)<br/>9 Portals + Web3.js Verifier & Signer"]
    API["Express 5 Modular Monolith (Port 3000)<br/>Auth, Vetting, FIFO, Forensics, Outbox"]
    DB[("PostgreSQL 17 + Prisma 6.19<br/>Append-Only Financial Ledger")]
  end

  API <--> DB
  API -->|Encrypted Evidence Pinning| IPFS[("IPFS Kubo 0.39")]
  API -->|Email Receipts & Invites| RESEND["Resend Email / SMS Provider"]
  API -->|Outbox Relayer tx| CHAIN["Polygon Amoy (80002) / Local Hardhat (31337)"]
  WEB -->|Public RPC Read Verify & EIP-712| CHAIN
  CL["Chainlink Price Feed & Automation"] -->|USD/KES Rate & Daily Upkeep| CHAIN
  CL -->|Daily Digest Check| API
```

---

## Key Architectural Invariants

1. **Money Never Enters Smart Contracts (`D1`):** Real fiat value stays inside Safaricom M-Pesa and CharityChain's designated bank accounts; Polygon smart contracts act purely as tamper-evident notaries and 2-of-3 multi-signature authorization verifiers.
2. **Zero-Wallet Public Transparency (`D2`):** Donors trace contributions (`MLK-XXXX-XXXX`), verify cryptographic hashes via browser `Web3.js`, claim receipts, and manage recognition consent without creating a blockchain wallet.
3. **Privacy-Preserving Evidence & Identity (`D3`, `D8`):** Beneficiaries and donors are represented on-chain only by domain-separated hashes (`idOf`) and server-keyed HMAC references (`refHash`); uploaded evidence is encrypted with AES-256-GCM before pinning to IPFS.
