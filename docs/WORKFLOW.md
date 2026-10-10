# Team Workflow

How we work together so five tracks can move in parallel without stepping on each other.

---

## 1. Roles

| Role | Who | Responsibility |
|---|---|---|
| Tech lead | Team lead | Owns `shared/`, approves interface changes, runs integration checkpoints, final say on architecture |
| Track owner | One dev per track | Plans the track's tasks, reviews PRs in the track, speaks for the track at checkpoints |
| Contributor | Any dev | Builds tasks from a track guide |
| Reviewer | Any dev | Reviews PRs, one from the same track, one from a consuming track for interface work |

If the team is smaller than five, merge tracks using this table. The tasks stay the same, only the owner changes.

| Team size | Suggested split |
|---|---|
| 3 | 1: A and the Chainlink part of C. 2: B and the integrity part of C. 3: D, plus E basics |
| 4 | 1: A. 2: B. 3: C and E. 4: D |
| 5 | One per track |
| 6 or more | Split B into B1 (daraja, donations, bank, items, inventory) and B2 (auth, cases, disbursements, evidence). Split D into D1 (public) and D2 (admin screens) |

---

## 2. Git

- `main` is always deployable to staging. Protected. No direct pushes.
- Branch names: `<track>/<short-topic>`, for example `a/donation-ledger`, `b/daraja-callbacks`, `c/rule-r03`, `d/trace-page`, `e/ci-contracts`.
- Commits follow Conventional Commits: `feat(b): add c2b confirmation handler`, `fix(d): wrong KES rounding on trace`, `test(a): replay case for authorizeRelease`, `docs: update ADR 0004`.
- Keep pull requests under about 400 changed lines. Split larger work.
- Rebase on `main` before opening the PR. Squash merge.
- Never commit secrets, `.env`, private keys, real beneficiary data or real M-Pesa numbers. CI scans for secrets and blocks the PR.

### CODEOWNERS (fill in real handles)

```
/blockchain/                    @track-a
/blockchain/functions/          @track-c @track-a
/backend/src/forensics/         @track-c
/backend/src/integrity/         @track-c
/backend/src/reports/           @track-c
/backend/src/simulator/         @track-c
/backend/prisma/                @track-b
/backend/                       @track-b
/frontend/                      @track-d
/shared/                        @tech-lead
/infra/ /.github/ /docs/        @track-e
```

---

## 3. Pull request rules

Every PR uses the template in `.github/pull_request_template.md`:

```
## What and why
## Track and task id (for example B7)
## How to test
## Screenshots (frontend)
## Checklist
- [ ] Tests added or updated
- [ ] No console errors, no lint or type errors
- [ ] Interface change? If yes, label `interface-change` and list affected tracks
- [ ] Docs updated (guide, ADR, README)
- [ ] No secrets or personal data
```

Review rules:

- One approval from the same track.
- Any change under `shared/`, `shared/openapi.json`, `shared/abis/`, or to a public event, error code or hashing rule also needs one approval from a consuming track and from the tech lead.
- Reviewers answer within one working day. If a PR is blocked longer, tell the tech lead.

---

## 4. Interface change protocol

Most integration pain comes from silent interface changes, so this is strict.

1. Open an issue labeled `interface-change` describing the change, the reason and who is affected.
2. Agree in the issue or in the weekly sync. After IC0, breaking changes need the tech lead.
3. Make the change in one PR: producer code, `shared/` update, new golden vectors if hashing is touched, and updated stubs.
4. Announce in the team channel with a link and the required action for each consumer.
5. Consumers update within two working days.

Prefer additive changes (a new optional field, a new endpoint) over breaking ones.

---

## 5. Definition of ready and done

**Ready** (a task can be picked up):

- It has an id from the track guide, for example `B6`.
- Acceptance criteria are written.
- Interfaces it needs exist or have a stub.

**Done** (a task can be closed):

- Code merged to `main` through a reviewed PR.
- Unit tests and, where relevant, integration tests pass in CI.
- The behavior is reachable in the local stack or covered by a test that proves it.
- Docs updated (OpenAPI is generated, the guide is ticked, an ADR exists if a decision was made).
- For contracts: coverage target met, Slither has no new findings.
- For UI: keyboard usable, mobile layout checked, English and Swahili strings present.
- For forensics rules: true positive and false positive fixtures present.

---

## 6. Cadence

| When | What | Length |
|---|---|---|
| Monday | Plan the week: each track owner lists the task ids for the week | 15 min |
| Wednesday | Sync: blockers and interface questions only | 15 min |
| Friday | Integration demo on `main` (not on a laptop) | 30 min |
| Every second Friday | Integration checkpoint (IC1 to IC4), full scenario run, retro | 60 min |

Written updates go in the team channel using this format: `Track X, done: ..., next: ..., blocked by: ...`.

---

## 7. Local setup (everyone)

```
git clone <repo> && cd charitychain
cp .env.example .env            # fill in local values from the team vault
pnpm install
pnpm dev:infra                  # postgres, mock-daraja (docker)
pnpm dev:chain                  # hardhat node and local deploy
pnpm --filter backend prisma migrate dev
pnpm dev:api                    # terminal 1
pnpm dev:worker                 # terminal 2
pnpm dev:web                    # terminal 3
pnpm seed                       # small demo dataset
```

Run the checks before pushing: `pnpm lint && pnpm typecheck && pnpm test`.

---

## 8. Communication

- Questions about an interface go in the issue, not in private messages, so everyone sees the answer.
- If you are blocked for more than half a day, say so in the channel.
- If you find a bug in someone else's track, open an issue with steps to reproduce and tag the owner. Do not silently patch their code.
- Decisions made in calls get written into an ADR or the issue within a day.

---

## 9. Quality gates in CI

| Gate | Applies to |
|---|---|
| Lint, format, typecheck | all workspaces |
| Unit and integration tests | all workspaces, run on path changes |
| Contract coverage at least 90 percent, 100 percent on approval paths | `blockchain/` |
| Slither and Solhint with no new high or medium findings | `blockchain/` |
| ABI drift check | `shared/abis` vs fresh build |
| OpenAPI drift check | `shared/openapi.json` vs generated |
| Hashing vectors pass in TypeScript and Solidity | `shared/` and `blockchain/` |
| Secret scan, dependency audit | repo wide |
| Build backend image and frontend bundle | main and PRs |
| Playwright smoke on key flows | `main` before staging deploy |
