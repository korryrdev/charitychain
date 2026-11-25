# CharityChain: Setup and Running Guide

This guide describes how to run CharityChain from a fresh clone. It covers the full local stack, the source-code development workflow, Prisma migrations, PostgreSQL, IPFS, database seeding, the simulated university records, and how the Super Administrator provisions access to all role-based dashboards.

---

## 1. What runs in the project

| Component | Technology | Local endpoint |
| --- | --- | --- |
| **Web Application** | React 19.3, React Router 7.18, Vite 8.3, Tailwind CSS | `http://localhost:5173` |
| **Backend REST API** | Node.js 22.12+, Express 5.3, Better-Auth | `http://localhost:3000` |
| **Database** | PostgreSQL 17 | host port `5433` |
| **ORM & Migrations** | Prisma Client & CLI 6.19 | `database/` workspace |
| **Evidence Storage** | IPFS Kubo 0.39 | API: `http://localhost:5001`, Gateway: `http://localhost:8080` |
| **Smart Contracts** | Solidity, Hardhat 3.21, OpenZeppelin 5.4, Viem | `blockchain/` workspace |

The repository is an npm-workspace monorepo containing `frontend`, `backend`, `database`, `blockchain`, `shared`, simulators, infrastructure, and documentation.

---

## 2. System Dashboards & Role Matrix

CharityChain enforces strict **Role-Based Access Control (RBAC)**. The application consists of 9 integrated dashboards and portals:

| Dashboard / Portal | URL Path | Required Role / Permission | Key Capabilities |
| --- | --- | --- | --- |
| **Public Website** | `/` | *None (Public)* | View public transparency metrics, donor recognition board, track donations, browse goods catalog, view governance policies. |
| **Donor Dashboard** | `/donor` | `DONOR` | Make monetary donations, declare physical goods, view donation history & tax receipts, manage public identity/alias. |
| **Student Dashboard** | `/student` | `STUDENT` | View university records, submit aid applications, track vetting status & committee decisions, request physical goods, manage appeals. |
| **Clerk Dashboard** | `/clerk` | `CLERK` | Intake physical donations, inspect delivered goods, record student pickups/collections, run daily intake reconciliation. |
| **Inventory Supervisor** | `/inventory` | `INVENTORY_SUPERVISOR` | Oversee warehouse stock, manage inventory batches & SKUs, inspect storage locations, monitor low-stock alerts. |
| **Committee Dashboard** | `/committee` | `COMMITTEE_MEMBER` | Review student aid applications, evaluate need-index metrics, participate in 2-of-3 quorum approvals, commit funding. |
| **Finance Dashboard** | `/finance` | `FINANCE_OPERATOR` | Execute approved tuition/upkeep disbursements, manage payout exceptions, perform bank/M-Pesa daily reconciliation. |
| **Auditor Dashboard** | `/auditor` | `AUDITOR` | Inspect immutable audit logs, investigate financial/goods anomalies, verify blockchain proof anchors. |
| **Super Admin Dashboard** | `/admin` | `ADMINISTRATOR` | System health, policy configuration, simulated student data, inventory settings, and **provisioning/inviting all other roles & dashboards**. |

---

## 3. Prerequisites

* **Git 2.x**
* **Node.js 22.12.0 or newer** (see `.nvmrc`)
* **npm 10 or newer** (included with supported Node releases)
* **Docker Desktop** with Docker Engine and Docker Compose v2 enabled
* The following ports must be free: `5173`, `3000`, `5433`, `4001`, `5001`, `8080`

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

```powershell
Copy-Item .env.example .env
```

Key configuration notes:
* **Database URL**:
  * For local Node.js processes: `DATABASE_URL=postgresql://charitychain:charitychain-local-only@localhost:5433/charitychain?schema=public`
  * For Docker Compose: automatically points to `postgres:5432`.
* **Secrets**: For production, ensure `SESSION_SECRET` and `ENCRYPTION_KEY` are cryptographically random strings.
* **Email & Integrations**: Keep `FEATURE_EMAIL_ENABLED=false` unless you provide a valid `RESEND_API_KEY`. In development mode, authentication verification tokens are auto-approved.

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

### Step 4: Seed the Database
CharityChain provides modular seed scripts. You can run all of them at once or individually:

#### Option A: Seed Everything in One Command (Recommended)
```powershell
npm run db:seed:all
```

#### Option B: Run Seeds Individually
1. **Core Roles & Permissions Seed:**
   ```powershell
   npm run db:seed
   ```
   *Creates the 8 system roles, 39 assignable permissions, role-permission matrices, and recognition tiers (Silver, Gold, Diamond, Platinum).*

2. **Simulated University Records Seed:**
   ```powershell
   npm run db:seed:university
   ```
   *Creates 30 deterministic university student records (`MUST/SIM/2026/001` through `030`), academic semesters, fee balances, HELB loan disbursements, exam blocks, and payment plans required for student vetting workflows.*

3. **Inventory & Goods Seed:**
   ```powershell
   npm run db:seed:inventory
   ```
   *Creates initial inventory categories (Sanitary Care, Personal Hygiene), stock batches (soap, pads, toothpaste, tissue), demonstration desk location, active goods collection policy, and a demo clerk account.*

4. **Super Administrator Seed:**
   ```powershell
   npm run db:seed:admin
   ```
   *Provisions an initial Super Administrator account:*
   * **Email:** `admin@charitychain.org`
   * **Password:** `Admin123456!`
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
   * Select `CLERK` &rarr; Unlocks the **Clerk Dashboard** (`/clerk`).
   * Select `INVENTORY_SUPERVISOR` &rarr; Unlocks the **Inventory Supervisor Dashboard** (`/inventory`).
   * Select `COMMITTEE_MEMBER` &rarr; Unlocks the **Committee Dashboard** (`/committee`).
   * Select `FINANCE_OPERATOR` &rarr; Unlocks the **Finance Dashboard** (`/finance`).
   * Select `AUDITOR` &rarr; Unlocks the **Auditor Dashboard** (`/auditor`).
   * Select `ADMINISTRATOR` &rarr; Grants co-administrator privileges over `/admin`.
5. **Assign Granular Permissions**:
   * Administrators can click on any user to view their assignable permission matrix (from the 39-permission catalog) and grant or revoke individual permissions (such as `disbursement:execute`, `goods-collection:release`, or `forensics:investigate`).
6. Click **Save / Create User**. The staff member can now log in at `http://localhost:5173/auth/login` and will be routed directly to their designated dashboard.

---

## 7. How Students and Donors Onboard

### Donor Onboarding
1. Anyone can visit `http://localhost:5173/auth/register` to create a Donor account.
2. The `DONOR` role is automatically assigned upon registration.
3. Donors can immediately donate funds or declare physical items from `/donor`.

### Student Onboarding
1. Students register at `http://localhost:5173/student/auth/register`.
2. The registration automatically assigns the `STUDENT` role.
3. To link their student profile, the student supplies their university registration number matching one of the seeded records (e.g. `MUST/SIM/2026/001` through `MUST/SIM/2026/030`).
4. Once linked, their academic semester, fee balance, and eligibility data populate automatically on `/student`.

---

## 8. Full Docker Stack Workflow (Alternative)

If you prefer running the entire stack (including Frontend and Backend) in Docker containers:

```powershell
docker compose up --build -d
docker compose ps
```

This starts:
* `postgres`: Database on port `5433`
* `ipfs`: Kubo node on ports `5001` and `8080`
* `bootstrap`: Automatically executes migrations and seeds roles/permissions
* `backend`: Express API on port `3000`
* `frontend`: Nginx serving production build on port `5173`

To seed simulated university students inside Docker:
```powershell
docker compose --profile tools run --rm simulator
```

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
Invoke-WebRequest http://localhost:3000/api/v1/health/ready
```

---

## 10. Troubleshooting

### Port already in use
Check which process is listening on project ports:
```powershell
netstat -ano | Select-String ':5173|:3000|:5433'
```
Stop existing processes or Docker containers before running `npm run dev`.

### Database connection failed
Ensure PostgreSQL container is running:
```powershell
docker compose ps postgres
```
Verify `DATABASE_URL` in `.env` uses port `5433` for local Node.js execution.

### Cannot log in as Super Admin
Ensure you ran the admin seed command:
```powershell
npm run db:seed:admin
```
Log in at `http://localhost:5173/auth/login` with `admin@charitychain.org` / `Admin123456!`.

### Student record not found
Ensure you ran the university simulation seed:
```powershell
npm run db:seed:university
```
Valid test registration numbers range from `MUST/SIM/2026/001` to `MUST/SIM/2026/030`.
