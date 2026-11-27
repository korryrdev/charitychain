# Database Migrations, Schema Tooling & Seeding

All database schema changes live in `@charitychain/database` (`database/`) and execute through [prisma.js](../../database/scripts/prisma.js), which injects root `.env` configuration automatically.

---

## 1. Committed Migrations (`26` Migrations)

Notable structural milestones inside `database/prisma/migrations/`:
* Core schema & RBAC baseline migrations through November 2026
* **`20261110230000_prd_entities_and_triggers`**: Creates the Malkia PRD tables (`subgroups`, `cases`, `case_events`, `case_approvals`, `lots`, `allocations`, `donation_raw_callbacks`, `bank_deposits`, `bank_statement_lines`, `period_reports`, `forensic_alerts`, `forensic_alert_events`, `forensic_rule_configs`, `donor_preference_events`, `donor_badges`) and installs PostgreSQL immutability triggers (`case_events_append_only`, `allocations_append_only`, `donation_raw_callbacks_append_only`).
* **`20261111010000_student_appeals`**: Adds `StudentAppeal` for formal student vetting/eligibility appeals.

Verified by `database/tests/migrations.test.js` and `database/tests/constraints.test.js`.

---

## 2. Standard Commands

```bash
# Validate Prisma schema syntax & relations
npm run db:validate

# Generate Prisma Client (v6.19.0) into root node_modules
npm run db:generate

# Create a new development migration locally
npm run db:migrate

# Apply committed migrations non-interactively (CI / Docker / Local)
npm run migrate:deploy -w @charitychain/database

# Inspect migration state
node database/scripts/prisma.js migrate status --schema database/prisma/schema.prisma
```

---

## 3. Idempotent Seeders (Admin Only)

Only the structural RBAC catalog and the initial Super Administrator account are seeded from the workspace root:

| Command | Script | What It Provisions |
| --- | --- | --- |
| `npm run db:seed` | `database/prisma/seed.js` | All **14** roles, **55** permissions, role-permission mappings, institutional tiers (`Silver/Gold/Diamond/Platinum`), purges legacy demo sessions, and delegates to `seedAdmin.js`. |
| `npm run db:seed:admin` | `database/prisma/seedAdmin.js` | Single Super Administrator account (`admin@charitychain.org` / `Admin123456!`, configurable via `ADMIN_EMAIL` / `ADMIN_PASSWORD`). |
