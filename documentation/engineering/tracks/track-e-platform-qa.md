# Track E: Platform, QA and Docs

**Folders you own:** `infrastructure/`, `.github/`, `documentation/`, the root tooling (`package.json`, ESLint/Prettier config, scripts), the cross-track test harness
**You provide:** One command local stack, CI and quality gates, deployments, test strategy, security review, evaluation protocol, thesis ready documentation
**You consume:** Everything. You are the glue and the safety net

Read first: [Architecture Overview](../../architecture/overview.md) sections 7, 8, 9, 10 and [Team Workflow](../workflow.md).

---

## 1. Mission

Keep everyone unblocked and keep the project honest. If a developer can clone, run one command and see the whole system, and if main is always green, Track E is doing its job. You also own the evidence the panel will ask for: tests, security findings, evaluation results and clean documentation.

---

## 2. Stack

- pnpm workspaces, Node 20 (pin with `.nvmrc` and `engines`)
- ESLint, Prettier, `tsconfig.base.json`, Husky, lint-staged, commitlint
- Docker and Docker Compose
- GitHub Actions, CODEOWNERS, PR and issue templates
- Playwright, k6 or autocannon, `gitleaks`, `pnpm audit`, Dependabot or Renovate
- Hosting: Vercel (frontend), Render or Railway (backend, worker, Postgres), Pinata, an Amoy RPC provider
- Mermaid and draw.io for diagrams

---

## 3. Folder layout

```
infra/
  docker-compose.yml        postgres, mock-daraja, optional ipfs profile
  mock-daraja/              small Fastify app that posts C2B payloads
  scripts/                  bootstrap.sh, reset-db.sh, seed.sh
.github/
  workflows/
    ci.yml                  lint, typecheck, test per workspace (path filters)
    contracts.yml           coverage, slither, abi drift, vectors
    api-drift.yml           openapi drift
    e2e.yml                 playwright on main
    deploy-staging.yml
    security.yml            gitleaks, audit
  CODEOWNERS
  pull_request_template.md
  ISSUE_TEMPLATE/
documentation/
  README.md                  master engineering hub
  requirements/              product-requirements-document.md, acceptance-criteria.md
  architecture/              overview.md, hashing-specification.md, C4 & flows
  decisions/                 README.md (ADRs), unification-ledger.md
  engineering/               workflow.md, breakdowns, tracks/track-*.md
  security/  testing/  deployment/  operations/  user-guides/
```

---

## 4. Build order

### E1. Root tooling (feeds IC0, do this first)
Workspace config, shared TS config, ESLint and Prettier, Husky and commitlint, `.editorconfig`, `.nvmrc`, `.env.example` with names only, root scripts `dev`, `dev:infra`, `dev:chain`, `dev:api`, `dev:worker`, `dev:web`, `seed`, `lint`, `typecheck`, `test`.
**Done when:** a new machine can run `pnpm install && pnpm lint` and everything passes on the empty skeleton.

### E2. CI skeleton
Workflows from the layout above with path filters so a docs change does not run contract tests. Cache pnpm. Required checks configured on `main`.
**Done when:** a failing test in any workspace blocks merge.

### E3. Local stack
`docker-compose.yml` with Postgres 16 and mock-daraja, optional IPFS profile. `mock-daraja` can send valid payments, duplicates, late callbacks, malformed bodies and masked phone numbers, driven by a small CLI (`pnpm mock:pay --amount 500`). Scripts to reset and seed the database.
**Done when:** `pnpm dev` starts everything and a mock payment appears in the database (after Track B6).

### E4. Repo governance
CODEOWNERS with real handles, PR template, issue templates (bug, task, interface change), labels (`track-a`..`track-e`, `interface-change`, `blocked`, `security`), branch protection instructions documented under [Team Workflow](../workflow.md).
**Done when:** a PR touching `shared/` automatically requests the tech lead.

### E5. Contract quality gates
Contracts workflow: coverage threshold, Slither and Solhint, ABI drift check (fresh build equals `shared/abis`), hashing vectors run in both TypeScript and Hardhat, publish gas report as an artifact.
**Done when:** changing a hashing rule in TypeScript only fails CI.

### E6. Cross-track end to end harness
Playwright plus Docker based flow that boots the stack, loads a minimal seed, and runs: M-Pesa donation to verified trace, case to payout with two test signatories, alert raised and resolved. Runs on `main` and on demand for PRs labeled `e2e`.
**Done when:** the three flows pass headless in CI in under ten minutes.

### E7. Deployments and runbooks
- Staging: frontend/API deployment, managed Postgres with backups, env management, Amoy RPC provider, Pinata/IPFS keys, funded relayer with a small balance.
- Runbooks in [Deployment Guide](../../deployment/deployment-guide.md), [Rollback](../../deployment/rollback.md), [Incident Response](../../security/incident-response.md), and [Backup and Restore](../../operations/backup-and-restore.md): deploy contracts and update manifests, rotate relayer key, change signatories, recover a stuck outbox, restore the database, add an env var.
- Health checks and uptime checks on `/api/v1/health/ready` and public trace endpoints.
**Done when:** staging/demo deploys cleanly and a teammate can follow a runbook cold.

### E8. Security review
Walk the PRD threat table (section 14.2) and [Threat Model](../../security/threat-model.md). Run dependency audit, secret scan, test the authorization matrix, try replaying Daraja callbacks, try guessing receipt codes, try to read beneficiary data without permission. Try to infer an anonymous donor from the recognition wall, the trace page and the dashboard (timing, amounts, counts), and try to publish an offensive or impersonating name. Record findings and fixes in [Threat Model](../../security/threat-model.md) and [Access Control](../../security/access-control.md).
**Done when:** no open critical or high findings and every medium has an owner and date.

### E9. Documentation and thesis support
- Keep [Root README](../../../README.md) and [Documentation Hub](../../README.md) current.
- ADRs from [Architecture Overview](../../architecture/overview.md) section 11 recorded under [Architecture Decisions](../../decisions/README.md).
- Collect results into [Testing Strategy](../../testing/strategy.md), [Test Cases](../../testing/test-cases.md), and [Traceability Matrix](../../testing/traceability-matrix.md): test coverage, Slither summary, forensic evaluation metrics, and performance numbers.
- Demo script for the lecturer: step by step with expected outcomes.

### E10. Usability evaluation (Objective v)
- Plan: five to eight Malkia committee members and eight to ten donors, 20 to 30 minute sessions.
- Materials: task scripts (trace a donation, raise and approve a case, sign a release, read the quarterly report, set a display preference and find your badge), consent form, SUS questionnaire, short interview guide, observation sheet.
- Seed data only, never real beneficiary information.
- Analyze task success, time on task, SUS score, quotes. Feed back into backlog.
- Confirm consent and data handling with the supervisor before sessions.
**Done when:** usability metrics align with PRD §3.3 targets in [Acceptance Criteria](../../requirements/acceptance-criteria.md).

---

## 5. Rules

- Main stays green. If it breaks, fixing it is everyone's top priority.
- No secrets in git, ever. If one leaks, rotate it first, then clean history.
- Automation first. If you do something by hand twice, script it.
- Be a service to the tracks. Ask what slows them down at every Wednesday sync.
- Document decisions where they are made (issue, ADR), not in chat only.
- Do not become the owner of other tracks' code. Report problems with steps to reproduce and let owners fix.

---

## 6. Test strategy summary

| Layer | Owner | Where it runs |
|---|---|---|
| Contract unit and property tests | A | CI contracts workflow |
| Backend unit and integration | B and C | CI per workspace |
| Rule fixtures and evaluation | C | CI, nightly evaluation |
| Frontend unit and component | D | CI per workspace |
| End to end flows | E | CI on main, on demand for PRs |
| Accessibility | D, checked by E | CI |
| Security review and scans | E | Scheduled and before IC4 |
| Load smoke | E | Before IC4 |
| Usability | E with D | Before submission |

---

## 7. Hand offs

| To | What | When |
|---|---|---|
| Everyone | Working `pnpm dev`, CI, templates, CODEOWNERS | IC0 |
| B | mock-daraja | Week 2 |
| Everyone | E2E harness | IC1, extended at IC2 and IC3 |
| Tech lead | Staging deployment and runbooks | Before IC2 |
| Tech lead | Security review report | IC4 |
| Tech lead | Demo script, evaluation results, thesis ready diagrams | IC4 |

---

## 8. Definition of done for the track

One command local stack works on a clean machine, CI gates are enforced, staging and demo deploy cleanly, runbooks exist and have been verified, the security review is complete, and usability/evaluation results meet targets in [Acceptance Criteria](../../requirements/acceptance-criteria.md).
