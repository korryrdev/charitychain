# CharityChain Workspace Rules

## Database Seeding & Operational Data Policy

- **No Mock or Demo Database Seeding**: Never seed the database (`database/prisma/seed.js`, migrations, or bootstrap scripts) with mock, demo, or simulated operational data. Do not add fake students, donors, donations, financial records, assistance applications, goods inventory, or demo staff accounts to any live/development seed. All operational records must enter the system through real application workflows or real institutional integrations.
- **Permitted Bootstrap Seed Data Only**: `database/prisma/seed.js` may only provision essential structural/reference data required to boot the application:
  - System `Role`, `Permission`, `RolePermission`, and `RecognitionTier` definitions
  - The current active `AcademicSemester` row (only if no active semester exists)
  - The single real bootstrap `ADMINISTRATOR` account via `database/prisma/seedAdmin.js`
- **Test Fixtures**: Synthetic data and test helpers belong strictly inside automated test suites (`backend/tests/`, `frontend/src/**/tests/`), never in live/development seed scripts.
- **Bootstrap Administrator Email**: Use `ADMIN_EMAIL` (default `kotlin.hustlehub@gmail.com`) for the seeded Super Administrator account so verification, password-reset, and MFA/security emails reach an active inbox.
