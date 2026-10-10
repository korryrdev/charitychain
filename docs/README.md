# CharityChain docs

Start here. Everything a developer needs to know where to look.

| Document | Read it when |
|---|---|
| [fullPRD.md](./fullPRD.md) | You want to know what we are building and why |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | You want to know how the pieces fit, which flow does what, and which interfaces are frozen |
| [WORKFLOW.md](./WORKFLOW.md) | You are about to open your first branch or PR |
| [guide-track-a-blockchain.md](./guide-track-a-blockchain.md) | You build the smart contracts (`blockchain/`) |
| [guide-track-b-backend-core.md](./guide-track-b-backend-core.md) | You build the API, database, Daraja and chain client (`backend/`) |
| [guide-track-c-forensics-integrity.md](./guide-track-c-forensics-integrity.md) | You build rules, simulator, digest and reports (`backend/src/forensics` and friends) |
| [guide-track-d-frontend.md](./guide-track-d-frontend.md) | You build the web app (`frontend/`) |
| [guide-track-e-platform-qa.md](./guide-track-e-platform-qa.md) | You own CI, infra, testing, security review and thesis evidence |

## Your first day

1. Read the PRD summary (section 1) and `ARCHITECTURE.md` sections 1 to 4.
2. Read your track guide end to end.
3. Run the setup commands in `WORKFLOW.md` section 7.
4. Pick the first unclaimed task id in your guide, tell the team channel, open a branch named `<track>/<topic>`.

## Naming

The organization is spelled **Malkia**.

## Track map

| Track | Folders | Owner |
|---|---|---|
| A Blockchain | `blockchain/` | |
| B Backend core | `backend/` (except forensics, integrity, reports, simulator) | |
| C Forensics and integrity | `backend/src/forensics`, `integrity`, `reports`, `simulator`, `blockchain/functions` | |
| D Frontend | `frontend/` | |
| E Platform, QA, docs | `infra/`, `.github/`, `docs/` | |
| Tech lead | `shared/` | |

Fill in the owner column once the team is assigned.

## Integration checkpoints

IC0 interfaces frozen (week 1), IC1 first donation (week 3), IC2 case to payout (week 5), IC3 alerts and dashboard (week 7), IC4 demo candidate (week 9). Details in `ARCHITECTURE.md` section 10.
