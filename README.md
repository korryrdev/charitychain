# CharityChain

CharityChain is a transparent donation, assistance, inventory, and forensic-audit platform for monetary and physical contributions.

## Foundation stack

- React and Vite frontend
- Node.js and Express API
- PostgreSQL and Prisma
- Solidity, Hardhat, Web3.js, and Polygon-compatible contracts
- IPFS local service
- npm workspaces

## Run locally

CharityChain supports a complete Docker Compose stack and an equivalent local-development workflow. The Docker stack starts PostgreSQL, IPFS, the database bootstrap, API, and frontend; the local workflow is useful when actively editing source code.

See [setup-and-running.md](documentation/setup-and-running.md) for prerequisites, exact versions, environment configuration, migrations, seed data, simulator commands, health checks, testing, and troubleshooting.

## Verification

Run `npm run verify` to lint, check formatting, validate Prisma, build every workspace, compile contracts, and execute the complete foundation test suite.

See `documentation/system dashboards.md` and `documentation/project structure.md` for the approved plans.
