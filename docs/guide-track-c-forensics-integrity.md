# Track C: Forensics and Integrity

**Folders you own:** `backend/src/forensics`, `backend/src/integrity`, `backend/src/reports`, `backend/src/simulator`, `blockchain/functions` (with Track A)
**You provide:** The rule engine and alerts, the fund flow graph, the daily digest and Merkle tooling, the quarterly report builder, the fraud simulator and the evaluation numbers
**You consume:** Domain events and the `forensics_read` views from Track B, hashing from `shared/`, contract access from Track A

Read first: `ARCHITECTURE.md` sections 4.4, 4.5, 5.3, 5.4, 5.5 and PRD sections 7.5, 7.6, 7.7, 12.

---

## 1. Mission

Make the project provable. Track B records what happened. You decide whether it looks honest, prove the record was not altered, and produce the numbers we put in front of the panel: how many frauds we detect, how many false alarms, and a quarterly report anyone can verify.

---

## 2. Stack

- TypeScript (strict). Rules and graph code are pure functions with no framework imports
- Prisma read access through the `forensics_ro` role and `forensics_read` views
- pg-boss schedules for nightly and daily jobs
- `canonicalize` (RFC 8785), `@noble/hashes` or `ethers`/`web3-utils` for keccak, `@openzeppelin/merkle-tree` or your own sorted-pair Merkle implementation in `shared/hashing`
- PDF: `pdfkit` or `@react-pdf/renderer`, QR with `qrcode`
- Simulation and stats: plain TypeScript, `seedrandom` for deterministic runs, optionally `simple-statistics`
- Chainlink: `@chainlink/functions-toolkit` for local simulation of the Functions script
- Vitest for everything

---

## 3. Folder layout

```
backend/src/
  forensics/
    types.ts            Rule, RuleContext, LedgerSnapshot, Alert, Severity
    engine.ts           runs rules incrementally and in full passes
    scoring.ts          risk score 0 to 100
    alerts.service.ts   dedupe, lifecycle, persistence
    snapshot.ts         builds LedgerSnapshot from forensics_read views
    graph.ts            nodes and edges, sankey data
    rules/
      r01-missing-evidence.ts
      r02-over-authorized.ts
      ... one file per rule
      index.ts          registry
      __fixtures__/     per rule true positive and false positive cases
  integrity/
    digest.ts           daily merkle root from audit entries
    verify.ts           CLI: verify audit chain and a given day root
    daily.job.ts
  reports/
    aggregate.ts        quarterly numbers from the database
    canonical.ts        report data to canonical JSON and hash
    pdf.ts
    build.ts
  simulator/
    scenarios/          one file per injected fraud
    generator.ts        baseline Malkia activity, seeded
    loader.ts           applies events through real services
    evaluate.ts         precision and recall per rule
    cli.ts              pnpm sim --seed 42 --months 12
blockchain/functions/
  checkDigest.js        Chainlink Functions source
  fxRate.js
```

---

## 4. Core types

```ts
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LedgerSnapshot {
  asOf: Date;
  donations: DonationView[];      lots: LotView[];
  cases: CaseView[];              approvals: ApprovalView[];
  disbursements: DisbursementView[]; allocations: AllocationView[];
  bankDeposits: BankDepositView[]; statementLines: StatementLineView[];
  items: ItemView[];              inventory: InventoryMovementView[];
  users: UserView[];              audit: AuditView[];
}

export interface RuleContext {
  snapshot: LedgerSnapshot;
  params: Record<string, number | string>;   // thresholds from the rules table
  trigger?: { event: string; id: string };   // present for incremental runs
}

export interface Rule {
  id: string;                  // 'R03'
  version: number;
  severity: Severity;
  describe(): string;          // one sentence a student can read
  evaluate(ctx: RuleContext): Finding[];
}

export interface Finding {
  ruleId: string;
  subjectKind: 'donation' | 'case' | 'disbursement' | 'user' | 'pool' | 'day';
  subjectId: string;
  why: string;                 // one sentence, plain language
  evidence: { kind: string; id: string }[];
  scoreHints?: Record<string, number>;
}
```

Alerts are deduplicated on `ruleId + subjectKind + subjectId`.

---

## 5. Build order

### C1. Types and rule contract (feeds IC0)
Write `types.ts`, the rule registry and the fixture format. Agree the `forensics_read` view columns with Track B.
**Done when:** a dummy rule runs against a hand built snapshot in a test.

### C2. Snapshot and engine
- `snapshot.ts` reads views, supports a full snapshot and a windowed one.
- `engine.ts` subscribes to domain events (incremental, only rules interested in that event) and runs a nightly full pass.
- Alerts are written to `alerts` and `alert_events`, never edited, only appended with state changes (open, investigating, resolved, false positive). Resolving needs a note.
**Done when:** an incremental run and a full run give the same alerts for the same data.

### C3. Phase 1 rules
Implement and fixture test the Phase 1 rules from PRD 12.2: R01, R02, R03, R04, R05, R06, R08, R09, R10, R11, R13, R15, R16. Every rule has at least three true positive fixtures and three false positive fixtures, plus a threshold boundary case.
**Done when:** `pnpm --filter backend test forensics` is green and each rule's `describe()` reads clearly.

### C4. Scoring
Base from severity, modifiers for amount relative to pool size, repeat offenders (same actors in other open alerts), and recency. Output 0 to 100. Weights live in the `rules` table.
**Done when:** a test shows the ordering for a set of known alerts matches expectation.

### C5. Fund flow graph and sankey data
Build nodes (donation lots, cases, disbursements, users) and edges (allocation lines, approvals) and the per donation sankey that Track D draws on the trace page. Overlay open alerts on nodes. Provide endpoints through Track B (`GET /graph`, trace data).
**Done when:** a seeded dataset renders a connected graph and the sankey totals equal the donation amount.

### C6. Simulator and evaluation (the headline result)
- `generator.ts`: a year of plausible Malkia activity with seasonal donation peaks, three channels, realistic case sizes, deterministic with a seed.
- Scenarios (PRD 12.4): missing evidence, self approval, structured payments below a limit, two signatories approving everything, idle funds then a lump payout, phantom beneficiary, item shrinkage, database edit after anchoring, a donation reversed right after it triggered a badge tier-up, and badge farming with many small gifts.
- `loader.ts` applies events through the real services so audit chains, hashes and outbox rows are real.
- Each injected fraud writes a label to `ground_truth.json`.
- `evaluate.ts` compares alerts to labels and prints precision and recall per rule and overall, plus a time to detect.
**Done when:** `pnpm sim --seed 42 --months 12 && pnpm sim:eval` prints a table, and results are saved under `docs/thesis/evaluation/`.

### C7. Integrity
- `digest.ts` builds the daily Merkle root with the spec in `ARCHITECTURE.md` 5.5. Leaves are audit entry hashes ordered by `seq`.
- Daily job at 00:10 EAT: compute, store, expose through `GET /public/digest/:day` (Track B route), enqueue `anchorDaily`.
- `verify.ts`: CLI that walks the audit chain and checks any day root against the chain.
- Merkle proof endpoint for a single audit entry (stretch).
**Done when:** editing a stored audit row in a test makes `verify` fail and makes rule R17 fire.

### C8. Chainlink Functions (with Track A)
- `checkDigest.js`: fetch `GET /public/digest/:day`, return the root as bytes32.
- `fxRate.js`: fetch a KES rate from the configured source and return it scaled to an integer.
- Simulate locally with the functions toolkit before any testnet request. Document the subscription setup in `blockchain/docs/functions-setup.md`.
- Decide at the end of Block 4 (week 7) whether to ship Functions or the documented fallback.
**Done when:** local simulation returns the expected values and a testnet request round trips, or the fallback is merged and documented.

### C9. Quarterly report
- `aggregate.ts`: opening balance, inflow by channel, outflow by category and sub-group, items in and out, open alerts, closing balance. Integer math only.
- `canonical.ts`: canonical JSON and `reportHash = keccak256(canonicalJson)`. Same period always gives the same bytes. No timestamps that change between runs inside the hashed data (use period end and a fixed version).
- `pdf.ts`: render for humans, print the hash and a QR code that links to the public verify page.
- Corrections create a new version, never overwrite.
**Done when:** running the build twice produces identical JSON and identical hash, and Track D's verify page confirms it against the chain.

### C10. Rules Phase 2 and statistics
R07 (bank reconciliation, needs CSV import from B), R12, R14, R17, R18 including a Benford style check with a minimum sample size so small data does not trigger it.
Also R19 (donation reversed or disputed shortly after it caused a badge tier-up) and R20 (badge farming: many small donations from new or linked references in a short window). Both read `v_donor_totals` and the `badge.awarded` and `donation.reversed` events. Findings use donor references only, never names.
**Done when:** simulator results include these rules and the evaluation table is updated.

---

## 6. Rules

- A rule is a pure function. No database calls, no clock reads (use `snapshot.asOf`), no randomness.
- A finding must explain itself in one plain sentence and link to evidence ids.
- Never include beneficiary identity in a finding. Use case ids.
- Never delete an alert. Never edit a closed one.
- Thresholds are parameters, not constants in code.
- Prefer a few good rules with low false positives over many noisy ones. Report precision honestly.
- Hashing code lives in `shared/hashing`. Do not copy it into `integrity/`.

---

## 7. Testing

| Level | What |
|---|---|
| Rule fixtures | True positive, false positive and boundary for every rule |
| Engine | Incremental equals full, dedupe, lifecycle, resolve needs a note |
| Integrity | Tamper detection, empty day root, Merkle proofs against OpenZeppelin `MerkleProof` in a Hardhat test |
| Reports | Determinism, totals reconcile to the pool balance, corrections create versions |
| Simulator | Same seed same data, labels match injected events |
| Evaluation | Run in CI nightly on a small seed and fail if recall drops below the agreed floor |

---

## 8. Hand offs

| To | What | When |
|---|---|---|
| B | View column needs and event payloads | IC0 |
| D | Alert and graph response shapes, sankey data format | Before IC3 |
| B | Digest and report build functions to call from routes | Before IC3 |
| A | Functions sources and expected response format | Before IC3 |
| E | Evaluation outputs for the thesis, report build runbook | IC4 |

---

## 9. Definition of done for the track

Rules R01 to R16 implemented with fixtures, the simulator reproduces all ten scenarios, evaluation numbers are saved, the daily digest and tamper detection work, the quarterly report is deterministic and verifiable, and Chainlink Functions (or the documented fallback) runs.
