# PRD, Brief & Rules Traceability Matrix

Maps every lecturer brief deliverable, required technology, Chapter One objective ([PRD §22](../requirements/product-requirements-document.md#22-traceability-to-the-brief-and-to-chapter-one)), and forensic rule (`R01`–`R20`) to verified implementation files in the repository.

---

## 1. Lecturer Brief Deliverables & Technologies

| Deliverable / Technology | PRD Sections | Primary Repository Implementation | Verification Suite |
| --- | --- | --- | --- |
| **Smart Contracts (`Solidity 0.8.28`, `Polygon Amoy`)** | §9 | `blockchain/contracts/{CharityChainAccess,DonationLedger,CaseWorkflow,SignatoryRegistry,PeriodAnchor,EvidenceRegistry,ChainlinkFxAndAutomation}.sol` + `shared/abis/` | `blockchain/test/unit/*.test.js` |
| **Donation DApp (`React 19`, `Web3.js v4`)** | §7.1, §7.2, §8, §13 | `frontend/src/app/routeConfig.js`, `pages/*`, `features/signing/SigningQueuePage.tsx` (MetaMask EIP-712), `features/trace/TracePage.tsx` | `frontend/src/**/*.test.{js,jsx,tsx}` |
| **Chainlink Off-Chain Data & Automation** | §5 D7, §9.5 | `blockchain/contracts/ChainlinkFxAndAutomation.sol`, `MockChainlinkAggregator.sol`, `GET /api/v1/public/chainlink/automation` | `CoreContracts.test.js`, `phase3Features.test.js` |
| **IPFS Encrypted Evidence Storage** | §5 D8, §7.2 | `docker-compose.yml` (`ipfs/kubo:v0.39.0`), `backend/src/integrations/ipfs/`, `modules/evidence/` | `ipfsAdapter.test.js`, `evidenceCryptography.test.js`, `evidence.test.js` |
| **Fund-Flow Tracking & FIFO Lots** | §5 D4, §7.3, §12 | `backend/src/modules/lots/`, `alerts/alerts.service.js`, `frontend/src/features/trace/SankeyFlow.tsx`, `features/graph/FundFlowGraphPage.tsx` | `lotsAndFifo.test.js`, `phase2Features.test.js` |
| **Forensic Analytics Dashboard** | §12 | `backend/src/modules/{alerts,forensicAnalytics}/`, `backend/src/simulator/fraudSimulator.js`, `features/alerts/AlertsPage.tsx` | `forensicAnalytics.test.js`, `phase2Features.test.js` |
| **Transparency Dashboard & Donor Privacy** | §7.4, §7.9, §13 | `backend/src/modules/public/`, `donors/`, `frontend/src/features/{dashboard,recognition,donor}/`, `pages/public/` | `transparency.test.js`, `donorReference.test.js`, `phase2Features.test.js`, `phase3Features.test.js` |

---

## 2. Forensic Rule Coverage (`R01`–`R20`)

| Rule ID | Detection Target | Phase | Backend Module / Verification |
| --- | --- | --- | --- |
| `R01` | Disbursement recorded without evidence | 1 | `alerts.service.js`, `casesWorkflow.test.js`, `forensicAnalytics.test.js` |
| `R02` | Disbursement exceeds authorized amount | 1 | `cases.service.js`, `CaseWorkflow.sol`, `forensicAnalytics.test.js` |
| `R03` | Self-approved case (`approver === submitter`) | 1 | `cases.service.js` (`assertSegregation`), `forensicAnalytics.test.js` |
| `R04` | Bank deposit verified by its own creator | 1 | `bank.service.js`, `bankDeposit.test.js` |
| `R05` | Pool dwell time (unspent funds exceeding threshold) | 1 | `alerts.service.js`, `forensicAnalytics.test.js` |
| `R06` | Ledger vs. M-Pesa Transaction Status mismatch | 1 | `integrations/mpesa/`, `forensicAnalytics.test.js` |
| `R07` | Bank statement line / deposit reconciliation mismatch | 2 | `bankReconciliation.service.js`, `bankReconciliation.test.js` |
| `R08` | Repeated payouts to same beneficiary within short window | 1 | `alerts.service.js`, `fraudSimulator.js` |
| `R09` | Structured disbursements clustered below approval threshold | 1 | `alerts.service.js`, `fraudSimulator.js` |
| `R10` | Signatory pair authorization concentration | 1 | `alerts.service.js`, `fraudSimulator.js` |
| `R11` | Out-of-hours approvals or releases | 1 | `alerts.service.js`, `forensicAnalytics.test.js` |
| `R12` | Structuring burst of small donations from one `donorRef` | 2 | `alerts.service.js`, `phase2Features.test.js` |
| `R13` | Single donation statistical outlier vs. history | 1 | `alerts.service.js`, `forensicAnalytics.test.js` |
| `R14` | Disproportionate share to one sub-group / digit anomaly | 2 | `alerts.service.js`, `phase2Features.test.js` |
| `R15` | Physical stock shrinkage (`issued > accepted`) | 1 | `items.service.js`, `forensicAnalytics/` |
| `R16` | Pool balance drift (`remaining !== inflow - allocated`) | 1 | `lots.service.js`, `lotsAndFifo.test.js` |
| `R17` | Daily Merkle root mismatch between DB and on-chain anchor | 2 | `dailyDigest.service.js`, `dailyDigest.test.js` |
| `R18` | Benford's Law & round-number disbursement pattern check | 2 | `alerts.service.js`, `phase2Features.test.js` |
| `R19` | Donation reversed shortly after triggering badge tier-up | 2 | `badges.service.js`, `fraudSimulator.js` |
| `R20` | Badge farming via rapid small gifts from linked refs | 2 | `alerts.service.js`, `fraudSimulator.js` |
