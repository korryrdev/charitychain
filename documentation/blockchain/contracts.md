# Smart Contracts Specification (`blockchain/contracts/`)

CharityChain's smart contracts implement a **non-custodial public notary** compiled with **Solidity 0.8.28** (`evm target: cancun`) and **OpenZeppelin Contracts 5.4** ([PRD §9](../requirements/product-requirements-document.md#9-smart-contracts)). No contract holds native tokens or ERC-20 funds, and no upgradeable proxy pattern is used.

---

## 1. Deployed & Verified Contract Suite (`7` Contracts)

| Contract | Source | Access Roles | Key Functions & Security Invariants |
| --- | --- | --- | --- |
| **`CharityChainAccess`** | [CharityChainAccess.sol](../../blockchain/contracts/CharityChainAccess.sol) | `DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE`, `SYSTEM_WRITER_ROLE`, `AUDITOR_ROLE` | Base OpenZeppelin `AccessControl` & `Pausable` guard shared by commitment contracts. |
| **`DonationLedger`** | [DonationLedger.sol](../../blockchain/contracts/DonationLedger.sol) | `DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE`, `RELAYER_ROLE` | Write-once `recordDonation(donationId, Donation)` computing canonical `HashLib.hashDonation(...)`. Reverts with `DonationAlreadyRecorded` on duplicate IDs; no update or delete path exists. |
| **`SignatoryRegistry`** | [SignatoryRegistry.sol](../../blockchain/contracts/SignatoryRegistry.sol) | `DEFAULT_ADMIN_ROLE`, `SIGNATORY_ADMIN_ROLE` | Maintains committee wallets; `verifyTwoOfThree` rejects fewer than 2 signatures, non-signatories (`NotASignatory`), or duplicate signers (`DuplicateSigner`). Rotating signatories via `addSignatory`/`removeSignatory` requires 2 existing signatories. |
| **`CaseWorkflow`** | [CaseWorkflow.sol](../../blockchain/contracts/CaseWorkflow.sol) | `DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE`, `RELAYER_ROLE` | Enforces forward case transitions (`SUBMITTED -> UNDER_REVIEW -> APPROVED -> AUTHORIZED -> DISBURSED -> CLOSED`), **EIP-712(`"CharityChain CaseWorkflow"`, `"1"`)** 2-of-3 `authorizeRelease` with per-case nonces and deadlines, and `recordDisbursement` ceiling check (`disbursed <= approved`). |
| **`PeriodAnchor`** | [PeriodAnchor.sol](../../blockchain/contracts/PeriodAnchor.sol) | `DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE`, `RELAYER_ROLE` | `anchorDaily(yyyymmdd, merkleRoot)` (once per calendar day) and versioned `anchorReport(year, quarter, reportHashVal, periodRoot)` (amendments increment version without overwriting history). |
| **`EvidenceRegistry`** | [EvidenceRegistry.sol](../../blockchain/contracts/EvidenceRegistry.sol) | `SYSTEM_WRITER_ROLE`, `AUDITOR_ROLE`, `PAUSER_ROLE` | Append-only commitment chaining (`anchor(commitment, subjectKey, previousCommitment)`) enforcing non-zero hashes, duplicate protection (`DuplicateCommitment`), and strict sequential chaining (`InvalidPreviousCommitment`). |
| **`ChainlinkFxAndAutomation`** | [ChainlinkFxAndAutomation.sol](../../blockchain/contracts/ChainlinkFxAndAutomation.sol) | `DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE`, `RELAYER_ROLE` | Consumes USD/KES `IChainlinkAggregatorV3` price feeds (`latestUsdKesRate`, `convertUsdCentsToKesMinor`) with `StalePriceFeed` & `InvalidFeedPrice` checks + configurable fallback rate, and implements Chainlink `IAutomationCompatible` (`checkUpkeep`/`performUpkeep`) to anchor staged daily Merkle roots into `PeriodAnchor`. |

Supporting shared Solidity modules:
* **Libraries:** `libraries/HashLib.sol` (matches [Canonical Hashing Specification](../architecture/hashing-specification.md)) and `libraries/Errors.sol` (gas-efficient custom errors).
* **Interfaces:** `interfaces/{IAutomationCompatible,ICaseWorkflow,IChainlinkAggregatorV3,IDonationLedger,IEvidenceRegistry,IIntegrityMonitor,IPeriodAnchor,ISignatoryRegistry}.sol`.
* **Local Test Mocks:** `contracts/mocks/MockChainlinkAggregator.sol`.

---

## 2. Cryptographic & EIP-712 Alignment

`CaseWorkflow.sol` initializes EIP-712 domain separator:
```solidity
EIP712("CharityChain CaseWorkflow", "1")
```
With typed struct:
```solidity
ReleaseAuthorization(bytes32 caseId,uint64 amountMinor,uint64 nonce,uint64 deadline)
```
Browser signing in `frontend/src/features/signing/SigningQueuePage.tsx` uses the exact same domain name `"CharityChain CaseWorkflow"` and version `"1"` so MetaMask signatures recover the exact registered signatory addresses on-chain.
