# Blockchain Deployments, Networks & ABI Exports

Contract compilation, deployment, and shared ABI synchronization are managed under `@charitychain/blockchain` (`blockchain/`).

---

## 1. Network Targets ([hardhat.config.js](../../blockchain/hardhat.config.js))

| Network Name | Chain ID | Default RPC URL Env / Fallback | Purpose |
| --- | --- | --- | --- |
| **`localhost`** | `31337` | `LOCAL_RPC_URL` (default `http://127.0.0.1:8545`) | Local Hardhat node + `MockChainlinkAggregator` for development and contract integration testing. |
| **`polygonAmoy`** | `80002` | `POLYGON_RPC_URL` (default `https://rpc-amoy.polygon.technology`) | Polygon Amoy EVM testnet deployment (`BLOCKCHAIN_SERVICE_PRIVATE_KEY` deployer account). |

Solidity compiler profile: `0.8.28` (`production` profile uses `optimizer: { enabled: true, runs: 200 }`).

---

## 2. Deployment Script & Role Wiring ([deploy.js](../../blockchain/scripts/deploy.js))

Executing `deploy.js` performs an ordered deployment:
1. Resolves `admin`, `relayer`, and 3 unique committee `signatories`.
2. Deploys `EvidenceRegistry(admin)`, `SignatoryRegistry(admin, signatories)`, `DonationLedger(admin, relayer)`, `CaseWorkflow(admin, relayer, signatoryRegistry)`, and `PeriodAnchor(admin, relayer)`.
3. Uses `CHAINLINK_USD_KES_FEED` on live testnets, or deploys `MockChainlinkAggregator` (`8` decimals, fallback rate `129.50 KES/USD`) on local networks.
4. Deploys `ChainlinkFxAndAutomation(admin, relayer, periodAnchor, feedAddress, 12950000000)`.
5. Grants `PeriodAnchor.RELAYER_ROLE` to `ChainlinkFxAndAutomation` so Chainlink Automation `performUpkeep(...)` can invoke `PeriodAnchor.anchorDaily(...)`.
6. Writes deployed addresses to `blockchain/deployments/<localhost|polygon-amoy|polygon-mainnet>/addresses.json` and exports all 7 ABIs to `shared/abis/`.

---

## 3. Compiling, Testing & Exporting ABIs

```bash
# Compile all 15 Solidity source files (contracts + interfaces + libraries + mock)
npm run contracts:compile

# Run Hardhat unit test suites
npm run test -w @charitychain/blockchain

# Export compiled ABIs to shared/abis/*.json
node blockchain/scripts/exportAbis.js
```

*(Note: when invoking `exportAbis` programmatically inside Hardhat 3, `deploy.js` invokes `exportAbis()` automatically and produces `CaseWorkflow.json`, `ChainlinkFxAndAutomation.json`, `CharityChainAccess.json`, `DonationLedger.json`, `EvidenceRegistry.json`, `PeriodAnchor.json`, and `SignatoryRegistry.json` in `shared/abis/`.)*

Relevant environment variables in `.env`:
* `BLOCKCHAIN_NETWORK` (`localhost` or `polygonAmoy`)
* `POLYGON_RPC_URL`, `BLOCKCHAIN_SERVICE_PRIVATE_KEY`, `BLOCKCHAIN_AUDIT_CONTRACT_ADDRESS`, `BLOCKCHAIN_CONFIRMATIONS`
* Frontend verification address: `VITE_CASE_WORKFLOW_ADDRESS`
