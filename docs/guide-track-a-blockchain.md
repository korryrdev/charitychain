# Track A: Blockchain

**Folder you own:** `blockchain/` (and `blockchain/functions/` together with Track C)
**You provide:** Solidity contracts, ABIs, deployment manifests, contract tests, security evidence
**You consume:** The hashing spec and vectors in `shared/`, the case and donation field lists from the PRD

Read first: `ARCHITECTURE.md` sections 1, 5.1, 5.5 and PRD section 9.

---

## 1. Mission

Build the notary. The contracts record donations, case transitions, release authorizations and anchors, in a way that nobody can alter later and anyone can verify. They never hold money.

If your contracts are small, boring and heavily tested, you did it right.

---

## 2. Stack

- Solidity 0.8.x (pin an exact version in `hardhat.config.ts`)
- Hardhat with TypeScript, Hardhat Ignition for deploys
- OpenZeppelin Contracts (`AccessControl`, `Pausable`, `EIP712`, `ECDSA`, `MerkleProof`)
- Chai and `@nomicfoundation/hardhat-chai-matchers`, `hardhat-gas-reporter`, `solidity-coverage`
- Optional fuzzing with Foundry (`forge test`) if someone on the team wants it
- Slither and Solhint
- Network: Polygon Amoy (chain id 80002). Local: Hardhat node

---

## 3. Folder layout

```
blockchain/
  contracts/
    interfaces/        IDonationLedger.sol, ICaseWorkflow.sol, IPeriodAnchor.sol,
                       ISignatoryRegistry.sol, IIntegrityMonitor.sol
    libraries/         HashLib.sol (mirrors shared/hashing), Errors.sol
    DonationLedger.sol
    SignatoryRegistry.sol
    CaseWorkflow.sol
    PeriodAnchor.sol
    IntegrityMonitor.sol
  test/
    DonationLedger.test.ts
    CaseWorkflow.test.ts
    SignatoryRegistry.test.ts
    PeriodAnchor.test.ts
    vectors.test.ts    loads shared/vectors/*.json and checks Solidity matches TS
  scripts/
    export-abis.ts     writes shared/abis/*.ts as `as const`
    write-manifest.ts  writes shared/deployments/<network>.json
    verify.ts
  ignition/modules/    deploy modules
  functions/           Chainlink Functions sources (with Track C)
  docs/                threat model, gas notes
```

---

## 4. Build order

Each task has an id. Tick them on the track board.

### A1. Project setup
Hardhat TS project, solhint config, solidity-coverage, gas reporter, Slither config, npm scripts `build`, `test`, `coverage`, `lint`, `slither`, `export-abis`, `node`.
**Done when:** `pnpm --filter blockchain test` runs with one dummy test in CI.

### A2. Interfaces and events (feeds IC0, do this first)
Write the five interface files with every function, event, custom error and struct. This is what B and D build against, so be complete.
**Done when:** `export-abis` produces `shared/abis/*.ts` from the interfaces, the tech lead reviews, and B and D confirm they can compile against it.

### A3. DonationLedger
- Roles: `DEFAULT_ADMIN_ROLE`, `RELAYER_ROLE`.
- `recordDonation(donationId, Donation d)` writes once per id. Reverts with `AlreadyRecorded(id)`.
- Store the record hash and `recordedAt`. Emit the full fields in `DonationRecorded` so indexers can rebuild everything. Expose `recordHashOf(id)` and `recordedAtOf(id)`.
- The hash must equal `shared/hashing/hashDonation` for the golden vectors.
- No update, no delete. A correction is a new record that references the old id in its event.
**Done when:** tests cover happy path, duplicate id, wrong role, paused, vector match, and a gas snapshot is recorded.

### A4. SignatoryRegistry and the EIP-712 helper
- Holds the set of signatories (exactly three at launch, configurable).
- `addSignatory` and `removeSignatory` require two existing signatories (EIP-712 signatures), except the initial setup done by the deployer in a one time `bootstrap`.
- Provide an internal `_verifyTwoOfThree(bytes32 digest, bytes[] sigs)` helper that checks: distinct signers, both hold `SIGNATORY_ROLE`, valid ECDSA, no duplicates, no malleable signatures (use OZ ECDSA).
**Done when:** tests cover same signer twice, a non-signatory, wrong chain id (domain separation), tampered amount, and signatory rotation.

### A5. CaseWorkflow
- State enum and allowed transitions from PRD 10.2.
- `submitCase`, `recordDecision` (relayer role), `authorizeRelease` (anyone may submit valid signatures), `recordDisbursement`, `close`.
- EIP-712 type: `ReleaseAuthorization(bytes32 caseId,uint64 amountMinor,uint64 nonce,uint64 deadline)`.
- Invariants to test:
  1. Only legal state transitions succeed.
  2. A case cannot be authorized twice.
  3. A signature cannot be replayed (nonce per case increments) or used after `deadline`.
  4. Disbursed total per case never exceeds the authorized amount.
  5. Nobody, including the relayer, can authorize without two valid signatories.
  6. The relayer cannot move a case backward or skip states.
**Done when:** all six invariants have named tests, plus a fuzz or property test on amounts.

### A6. PeriodAnchor
- `anchorDaily(day, root)` and `anchorReport(year, quarter, reportHash, periodRoot)`, each once per key, with versioning for report corrections (`version` increments, old versions stay readable).
- Getters `dailyRoot(day)` and `reportHash(year, quarter, version)`.
**Done when:** tests cover duplicates, wrong role, version increments.

### A7. Deploy and publish
- Ignition modules for local and Amoy, role wiring (grant `RELAYER_ROLE` to the relayer address, register signatories), pause admin.
- `write-manifest` produces `shared/deployments/<network>.json` in the format of `ARCHITECTURE.md` 5.1.
- Verify sources on Polygonscan (Amoy).
- Root script `pnpm dev:chain` starts a node, deploys, writes `local.json`, funds the relayer and three test signatories.
**Done when:** a fresh clone can run `pnpm dev:chain` and B can call the contracts.

### A8. IntegrityMonitor with Chainlink (with Track C)
- Consumer of Chainlink Functions: `requestCheck(day)` sends the JS source from `functions/`, `fulfillRequest` compares the returned root to `PeriodAnchor.dailyRoot(day)` and emits `IntegrityAlert(day, anchored, observed)` on mismatch.
- Subscription id is configuration, not hard coded.
- If time runs short, ship the fallback described in ARCHITECTURE 4.4 and keep this task as a documented extension.
**Done when:** a Hardhat test simulates a fulfillment with matching and non matching roots, and a testnet run succeeds (or the fallback is merged and documented).

### A9. Security pass
- Run Slither and Solhint, fix or justify every finding in `blockchain/docs/slither-triage.md`.
- Write `blockchain/docs/threat-model.md`: assets, actors, attacks (replay, malleability, griefing by the relayer, key loss, signer collusion) and how each is mitigated.
- Gas notes per function.
**Done when:** zero open high or medium findings and the threat model is reviewed by Track E.

---

## 5. Rules

- Use custom errors, not revert strings.
- No loops over unbounded data. No dynamic arrays growing in storage.
- No external calls to unknown contracts. No `delegatecall`. No `selfdestruct`. No upgradeable proxies.
- Every state change emits an event with enough data to rebuild state off-chain.
- Contracts never accept native tokens. Add a `receive()` that reverts to be explicit.
- Do not change a function signature or event after IC0 without the interface change protocol.
- Clarity beats gas golf. This is a notary, not a high frequency system.

---

## 6. Testing

| Kind | Target |
|---|---|
| Unit | Every function, every revert, every role |
| Property or fuzz | Amount invariants, state machine never skips |
| Vectors | `vectors.test.ts` checks `HashLib` against `shared/vectors/*.json`. A mismatch blocks release |
| Gas | `hardhat-gas-reporter` output saved to `blockchain/docs/gas.md` |
| Coverage | 90 percent lines overall, 100 percent on `CaseWorkflow` approval paths and `SignatoryRegistry` |

---

## 7. Hand offs

| To | What | When |
|---|---|---|
| B and D | Interfaces and ABIs | IC0 |
| B | Working local deploy (`pnpm dev:chain`) | End of week 2 |
| B and D | Amoy deployment and manifest | Before IC2 |
| C | `IntegrityMonitor` and test harness for Functions | Before IC3 |
| E | Slither report and threat model | Before IC4 |

---

## 8. Definition of done for the track

All contracts deployed to Amoy and verified, ABIs and manifest in `shared/`, coverage and Slither gates green in CI, threat model and gas notes written, hashing vectors pass on both sides.
