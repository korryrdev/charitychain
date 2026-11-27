# CharityChain: Setup and Running Guide

This guide describes how to run CharityChain from a fresh clone. It covers the full local stack, the source-code development workflow, Prisma migrations, PostgreSQL, IPFS, database seeding, the simulated university records, and how the Super Administrator provisions access to all role-based dashboards.

---

## 1. What runs in the project

| Component | Technology | Local endpoint |
| --- | --- | --- |
| **Web Application** | React 19.3, React Router 7.18, Vite 8.3 | `http://localhost:5173` |
| **Backend REST API** | Node.js 22.12+, Express 5.3, Better Auth | `http://localhost:3000` |
| **Database** | PostgreSQL 17 | host port `5435` |
| **ORM & Migrations** | Prisma Client & CLI 6.19 | `database/` workspace |
| **Evidence Storage** | IPFS Kubo 0.39 | API: `http://localhost:5001`, Gateway: `http://localhost:8080` |
| **Smart Contracts** | Solidity, Hardhat 3.21, OpenZeppelin 5.4, Web3.js 4.16 | `blockchain/` workspace |

The repository is an npm-workspace monorepo containing `frontend`, `backend`, `database`, `blockchain`, `shared`, simulators, infrastructure, and documentation.

---

## 2. System Dashboards & Role Matrix

CharityChain enforces strict **Role-Based Access Control (RBAC)**. The application consists of 9 integrated dashboards and portals:

| Dashboard / Portal | URL Path | Required Role / Permission | Key Capabilities |
| --- | --- | --- | --- |
| **Public Website & DApp Trace** | `/`, `/trace`, `/wall`, `/claim`, `/reports` | *None (Public)* | View public transparency metrics, Sankey donation trace & on-chain Web3.js verifier, anonymous-by-default donor recognition wall, receipt claiming, browse goods catalog, view governance policies. |
| **Donor Portal & DApp** | `/donor`, `/donor/dapp` | `DONOR` | Make monetary donations (M-Pesa/Bank/Testnet Crypto), declare physical goods, claim receipts, view impact badges & SVG certificates, manage public display preferences. |
| **Student Dashboard** | `/student` | `STUDENT` | View university records, submit aid applications, track vetting status & committee decisions, request physical goods, manage appeals. |
| **Clerk & Pharmacy Intake** | `/clerk`, `/inventory/pharmacy` | `CLERK`, `PHARMACY_CUSTODIAN` | Intake physical donations, mobile-first pharmacy item logging, inspect delivered goods, record student pickups/collections, run daily intake reconciliation. |
| **Inventory Supervisor** | `/inventory` | `INVENTORY_SUPERVISOR` | Oversee warehouse stock, manage inventory batches & SKUs, inspect storage locations, monitor low-stock & shrinkage alerts. |
| **Committee & Signing Queue** | `/committee`, `/committee/cases`, `/committee/signing` | `COMMITTEE_MEMBER`, `SUBGROUP_REP`, `SIGNATORY` | Review student aid applications, manage sub-group cases, execute 2-of-3 quorum approvals and Web3.js + MetaMask EIP-712 release signing. |
| **Finance Dashboard** | `/finance` | `FINANCE_OPERATOR`, `TREASURER` | Execute approved tuition/upkeep disbursements, enter & verify bank deposits (maker-checker), perform bank CSV / M-Pesa reconciliation. |
| **Auditor & Forensics** | `/auditor`, `/auditor/fund-flow-dag`, `/auditor/forensic-rules`, `/auditor/quarterly-reports` | `AUDITOR`, `MEMBER_AUDITOR` | Inspect immutable audit logs, explore 5-column PostgreSQL Fund-Flow DAG, triage R01–R20 anomalies, verify blockchain anchors & Merkle proofs. |
| **Super Admin Dashboard & `/app`** | `/admin`, `/admin/users`, `/app/*` | `ADMINISTRATOR`, `SYSTEM_ADMIN` | System health, policy configuration, simulated student data, inventory settings, standalone governance console (`/app/*`), and **provisioning/inviting all other roles & dashboards**. |

---

## 3. Prerequisites

* **Git 2.x**
* **Node.js 22.12.0 or newer** (see `.nvmrc`)
* **npm 10 or newer** (included with supported Node releases)
* **Docker Desktop** with Docker Engine and Docker Compose v2 enabled
* The following ports must be free: `5173`, `3000`, `5435`, `4001`, `5001`, `8080`

Verify your tools:
```powershell
node --version
npm --version
docker --version
docker compose version
```

---

## 4. Environment Configuration

Never commit a real `.env` file. Start from the versioned template:

```bash
# Linux / macOS
cp .env.example .env
```
```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Key configuration notes:
* **Single Root Configuration**: The repository-root `.env` is the single configuration source for Docker, the backend, Prisma, and Vite (`VITE_` variables only are exposed to browser code). Never put production credentials in a frontend-prefixed variable.
* **Database URL**:
  * For local Node.js processes with Docker PostgreSQL: `DATABASE_URL=postgresql://charitychain:change-for-local-development@localhost:5435/charitychain?schema=public`
  * For Docker Compose API container: Compose overrides it to `postgres:5432` automatically.
* **Secrets & Integrations**: Set `POSTGRES_PASSWORD`, `SESSION_SECRET`, and `ENCRYPTION_KEY` to cryptographically random strings in production. Keep `FEATURE_EMAIL_ENABLED=false` and payment/SMS feature flags disabled unless valid credentials are configured. In development mode, authentication verification tokens are auto-approved.

Use either the Docker workflow or the local-development workflow below; do not run both frontend/API modes on the same ports at the same time.

---

## 5. Step-by-Step Local Development Workflow

Follow these steps sequentially to set up and run the project from a fresh clone:

### Step 1: Install Dependencies
```powershell
npm ci
```

### Step 2: Start Infrastructure (PostgreSQL & IPFS)
Start the database and IPFS daemon using Docker Compose:
```powershell
docker compose up -d postgres ipfs
```
Wait a few seconds until both containers report healthy:
```powershell
docker compose ps
```

### Step 3: Run Database Migrations
Generate the Prisma client and apply committed migrations:
```powershell
npm run db:generate
npm run migrate:deploy -w @charitychain/database
```

### Step 4: Seed the Database (Admin + RBAC Catalog Only)
CharityChain seeds only the required RBAC catalog (**14** roles, **55** permissions, role-permission matrices, and **4** recognition tiers) plus a single Super Administrator account (`admin@charitychain.org`). Additional staff, donor, clerk, and student accounts are created dynamically through registration or the admin console.

```powershell
npm run db:seed
```

*To re-provision or reset only the Super Administrator account without re-running the RBAC matrix:*
```powershell
npm run db:seed:admin
```
* **Email:** `admin@charitychain.org` (override via `ADMIN_EMAIL`)
* **Password:** `Admin123456!` (override via `ADMIN_PASSWORD`)
* **Role:** `ADMINISTRATOR`

### Step 5: Start the Development Servers
Start both the Express API and Vite React frontend concurrently:
```powershell
npm run dev
```

* **Frontend:** `http://localhost:5173`
* **API:** `http://localhost:3000`
* **API Health Check:** `http://localhost:3000/api/v1/health/ready`

---

## 6. Super Admin: How Other Dashboards are Created & Managed

In CharityChain, staff members do **not** self-register into operational roles (Clerk, Finance, Auditor, Committee, Inventory Supervisor). Instead, **all staff accounts and dashboard permissions are provisioned and managed directly from the Super Admin Console**.

### How to Access the Super Admin Console
1. Open `http://localhost:5173/auth/login`.
2. Sign in with the seeded Administrator credentials:
   * **Email:** `admin@charitychain.org`
   * **Password:** `Admin123456!`
3. Navigate to **Users & Roles** (`http://localhost:5173/admin/users`).

### Creating Staff Users & Granting Dashboard Access
From the **Users & Roles** directory:
1. Click **"Create Staff Account"** or **"Invite User"**.
2. Enter the staff member's **Full Name** and **Email Address**.
3. A secure temporary password is generated (or you can specify credentials).
4. **Select Role(s)** to grant specific dashboard access:
   * Select `CLERK` or `PHARMACY_CUSTODIAN` &rarr; Unlocks the **Clerk & Pharmacy Intake Dashboards** (`/clerk`, `/inventory/pharmacy`).
   * Select `INVENTORY_SUPERVISOR` &rarr; Unlocks the **Inventory Supervisor Dashboard** (`/inventory`).
   * Select `SUBGROUP_REP`, `COMMITTEE_MEMBER`, or `SIGNATORY` &rarr; Unlocks the **Committee & EIP-712 Signing Portal** (`/committee`, `/committee/cases`, `/committee/signing`).
   * Select `FINANCE_OPERATOR` or `TREASURER` &rarr; Unlocks the **Finance & Bank Portal** (`/finance`, `/app/donations`).
   * Select `AUDITOR` or `MEMBER_AUDITOR` &rarr; Unlocks the **Auditor & Forensics Portal** (`/auditor`, `/auditor/fund-flow-dag`, `/auditor/forensic-rules`, `/auditor/quarterly-reports`).
   * Select `ADMINISTRATOR` or `SYSTEM_ADMIN` &rarr; Grants non-financial co-administrator privileges over `/admin` (barred from unilateral fund approvals per PRD FR-AUTH-03).
5. **Assign Granular Permissions**:
   * Administrators can click on any user to view their assignable permission matrix (from the **55-permission catalog**) and grant or revoke individual permissions (such as `disbursement:execute`, `goods-collection:release`, `release:authorize`, or `forensics:investigate`).
6. Click **Save / Create User**. The staff member can now log in at `http://localhost:5173/auth/login` (or use seeded Malkia governance accounts via `http://localhost:5173/login`) and will be routed directly to their designated dashboard. Notice `COMMITTEE_MEMBER`, `TREASURER`, and `SIGNATORY` accounts also sign `CaseWorkflow` 2-of-3 releases in `/committee/signing` using MetaMask `Web3.js` EIP-712 (or the built-in Demo Signatory fallback locally).

---

## 7. How Students and Donors Onboard

### Donor Onboarding
1. Anyone can visit `http://localhost:5173/auth/register` to create a Donor account.
2. The `DONOR` role is automatically assigned upon registration.
3. Donors can immediately donate funds or declare physical items from `/donor`.

### Student Onboarding
1. Students register with their university email (`name123456@students.must.ac.ke`) via `http://localhost:5173/auth/register` (Student tab) or `http://localhost:5173/student/auth/register`.
2. The registration assigns the `STUDENT` role.
3. To link their student profile, the student supplies their university registration number matching `^[A-Z]{2}\d{3}\/\d{6}\/\d{2}$` (e.g. `CT206/204483/24` or `CT201/000001/23`).
4. Once linked, their academic semester, fee balance, and eligibility data populate automatically on `/student`.

---

## 8. Full Docker Stack Workflow (Alternative)

If you prefer running the entire stack (including Frontend and Backend) in Docker containers:

```powershell
docker compose up --build -d
docker compose ps
```

This starts:
* `postgres`: Database on port `5435`
* `ipfs`: Kubo node on ports `5001` and `8080`
* `bootstrap`: Automatically executes migrations and seeds roles/permissions + the Super Administrator account
* `backend`: Express API on port `3000`
* `frontend`: Nginx serving production build on port `5173`

To stop containers:
```powershell
docker compose down
```

---

## 9. Verification & Testing

Run tests and code quality checks across all workspaces:

```powershell
npm run lint                  # Run ESLint across frontend and backend
npm run db:validate           # Validate Prisma schema
npm run contracts:compile     # Compile Hardhat smart contracts
npm test                      # Run unit & integration test suites
npm run verify                # Full CI verification suite
```

Check API readiness:
```powershell
docker compose ps
Invoke-WebRequest http://localhost:3000/api/v1/health/ready
```
Or with `curl`:
```bash
curl http://localhost:3000/api/v1/health/ready
```

---

## 10. M-Pesa Daraja Sandbox Configuration

Set `MPESA_ENVIRONMENT=sandbox` and fill `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_BUSINESS_SHORT_CODE` (or `MPESA_SHORTCODE`), and `MPESA_PASSKEY` in the root `.env`, then set `FEATURE_MPESA_ENABLED=true`. STK Push uses the Safaricom sandbox API; its callback URL uses `MPESA_CALLBACK_URL` (or `${MPESA_CALLBACK_BASE_URL}/api/v1/webhooks/payments/mpesa/stk`). Daraja must be able to reach that callback URL, so use a public HTTPS tunnel for local testing. The callback is reconciled with Daraja's STK Push Query API before a donation can be marked paid.

The initiator/security credential and university shortcode/account variables are needed only for M-Pesa disbursements. Do not send Daraja credentials in chat or commit them; configure them only in the ignored root `.env`.

---

## 11. Database Operations Reference

Prisma schema: `database/prisma/schema.prisma`.

| Task | Command |
| --- | --- |
| Generate Prisma Client | `npm run db:generate` |
| Validate Prisma schema | `npm run db:validate` |
| Create a new local migration during schema development | `npm run db:migrate` |
| Apply committed migrations in a deployment | `npm run migrate:deploy -w @charitychain/database` |
| Seed core roles, permissions, tiers, and Admin account | `npm run db:seed` |
| Seed/update only the initial Super Administrator account | `npm run db:seed:admin` |
| Check migration state | `npx prisma migrate status --schema database/prisma/schema.prisma` |

Fresh databases must receive both migrations and `npm run db:seed` before accounts can be created because registration assigns roles (`DONOR`, `STUDENT`) and provisions the Super Administrator (`admin@charitychain.org`).

---

## 12. Authentication in Local Development

The local environment does not use a real email/SMS delivery provider unless configured. A development registration is verified automatically via development verification tokens so dashboards can be tested locally. Production does not expose verification tokens: it requires a configured delivery provider (`RESEND_API_KEY`) and the standard verification process.

Student self-registration validates the university format (`name123456@students.must.ac.ke`). Accounts can hold verified student capability through university registration number linkage to the local simulated university record.

---

## 13. Troubleshooting

### Port already in use
Check which process is listening on project ports:
```powershell
netstat -ano | Select-String ':5173|:3000|:5435'
```
Stop existing processes or Docker containers before running `npm run dev`.

### Database connection failed
Ensure PostgreSQL container is running and healthy:
```powershell
docker compose ps postgres
```
Verify `DATABASE_URL` in root `.env` uses port `5435` for local Node.js execution (`postgres:5432` inside Docker). If roles are missing, run `npm run migrate:deploy -w @charitychain/database` followed by `npm run db:seed`.

### Frontend shows an API or CSRF error
Use one local origin consistently (`http://localhost:5173` or `http://127.0.0.1:5173`), refresh once after an API restart, and check `/api/v1/health/ready`.

### Cannot log in as Super Admin
Ensure you ran the admin seed command:
```powershell
npm run db:seed:admin
```
Log in at `http://localhost:5173/auth/login` with `admin@charitychain.org` / `Admin123456!`.

### Invalid university registration number
Use the `CTxxx/xxxxxx/yy` format (`^[A-Z]{2}\d{3}\/\d{6}\/\d{2}$`), such as `CT206/204483/24` or `CT201/000001/23`.

---

## Production Note

The Docker Compose configuration is for reproducible local and demo use. Before production deployment, use managed secrets, HTTPS, a production database backup plan, real provider credentials, a hosted IPFS strategy, strict allowed origins, and a dedicated process supervisor or container platform. Do not expose local Docker ports or development secrets to the public internet.
