# Architecture Decision Records (ADRs)

Decisions that shape system boundaries, trust assumptions, or cross-workspace contracts are recorded here using the canonical ADR format defined in [Architecture Overview §11](../architecture/overview.md#11-architecture-decision-records).

## Decision Index

| ID | Title | Status | Summary |
| --- | --- | --- | --- |
| ADR-0001 | Modular Monolith API | Accepted | Single Express 5 + Node.js 22 HTTP process (`backend/`) backed by modular domain services instead of distributed microservices. |
| ADR-0002 | Off-Chain Money & On-Chain Notary | Accepted | Fiat funds stay on M-Pesa Daraja and banking rails; smart contracts never hold custody of native tokens or ERC-20s (PRD D1). |
| ADR-0003 | Transactional Outbox Pattern | Accepted | Financial state mutations and `OutboxEvent` rows commit atomically in PostgreSQL before the relayer submits transactions to Polygon (PRD D6). |
| ADR-0004 | Canonical Hashing Spec v1 | Accepted | Isomorphic `keccak256` / ABI encoding across `blockchain/`, `backend/`, and browser `Web3.js` using [Hashing Specification](../architecture/hashing-specification.md). |
| ADR-0005 | FIFO Lot Allocation with Earmarks | Accepted | Monetary donations create `DonationLot` records consumed FIFO by disbursements while prioritizing matching category earmarks (PRD D4). |
| ADR-0006 | 2-of-3 EIP-712 Signatory Release | Accepted | Committee signatories sign structured `ReleaseAuthorization` messages under domain `"CharityChain CaseWorkflow"` v1 verified on-chain by `CaseWorkflow.sol` (PRD D5). |
| ADR-0007 | Encrypted Evidence on IPFS | Accepted | Sensitive beneficiary/disbursement receipts are encrypted with AES-256-GCM before pinning to IPFS Kubo; plaintext SHA-256 digests are notarized on-chain (PRD D8). |
| ADR-0008 | Chainlink FX Feed & Automation Upkeep | Accepted | `ChainlinkFxAndAutomation.sol` consumes USD/KES `AggregatorV3Interface` price feeds (with staleness protection and fallback) and `AutomationCompatibleInterface` daily Merkle root upkeep (PRD D7). |
| ADR-0009 | Pseudonymous Donor Identity & Off-Chain Badges | Accepted | Donations bind to server-keyed HMAC `donorRef` hashes defaulting to `ANONYMOUS` publicly; recognition walls and badges stay off-chain with `>= 5` k-anonymity (PRD D9). |
| ADR-0010 | Zero-Loss Branch & Documentation Unification | Accepted | Consolidated `aldo` and `kip`/`main` onto `feat/unified-charitychain` with `.tsx`/`.jsx` coexistence and unified `documentation/`; see [Unification Ledger](./unification-ledger.md). |

---

## ADR Format Template

```markdown
# NNNN Title
Status: proposed | accepted | superseded by NNNN
Context: what forces are in play
Decision: what we chose
Consequences: what gets easier, what gets harder
```

---

## Key Accepted Decisions (D1–D10 Summary)

### ADR-0002: Off-Chain Money and On-Chain Notary (D1)
* **Status:** Accepted
* **Context:** Malkia donors donate via M-Pesa Paybill, bank transfer, and campus pharmacy drop-offs rather than crypto wallets, while university auditors require tamper-evident proof.
* **Decision:** Smart contracts act strictly as an immutable notary storing commitment hashes, state transitions, and multi-sig authorizations without holding custody of funds.
* **Consequences:** Zero crypto custody liability and instant fiat UX; requires strict reconciliation (`R06`, `R07`, `R16`) and outbox reliability (`ADR-0003`) to keep PostgreSQL and Polygon synchronized.

### ADR-0004 & ADR-0006: Hashing Spec v1 and EIP-712 Domain Separation
* **Status:** Accepted
* **Context:** Browser-side `Web3.js` verification and MetaMask `eth_signTypedData_v4` signing must match `CaseWorkflow.sol` and `DonationLedger.sol` byte-for-byte.
* **Decision:** Freeze domain separators (`malkia:v1:*`) and `CaseWorkflow` EIP-712 domain (`name: "CharityChain CaseWorkflow"`, `version: "1"`). Notice the space in `"CharityChain CaseWorkflow"`, matching `CaseWorkflow.sol` constructor and `SigningQueuePage.tsx`.
* **Consequences:** Independent client verification works trustlessly via RPC without delegating verification to the backend API; any structural change requires a `v2` domain bump.

### ADR-0010: Zero-Loss Monorepo & Documentation Consolidation
* **Status:** Accepted
* **Context:** Parallel work across `aldo` (Solidity/Forensics/PRD) and `kip`/`main` (9 RBAC portals, M-Pesa Daraja result codes, Resend, simulated university records) produced overlapping frontends and two documentation folders (`docs/` and `documentation/`).
* **Decision:** Merge both codebases onto `feat/unified-charitychain` with `.tsx` + `.jsx` coexistence, CSS Cascade `@layer` isolation, unified Better-Auth/CSRF sessions, and consolidate all documentation into kebab-case files under `documentation/`.
* **Consequences:** Full feature parity across both project briefs with a single source of truth; detailed asset mapping is tracked in [Unification Ledger](./unification-ledger.md).
