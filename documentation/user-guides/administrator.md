# Administrator & Super-Admin User Guide (`/admin`)

The CharityChain Super Administrator dashboard (`ADMINISTRATOR` / `SYSTEM_ADMIN` roles) manages staff provisioning, role composition, policies, simulated university records, integration health, and security controls—while remaining strictly **barred in code (`FR-AUTH-03`) from approving cases or disbursing funds** ([Access Control](../security/access-control.md)).

---

## 1. Signing In & Console Access

1. Ensure database roles and the Super Administrator account are seeded (`npm run db:seed` or `npm run db:seed:admin`).
2. Navigate to `http://localhost:5173/auth/login`.
3. Sign in with the seeded Super Administrator credentials:
   * **Email:** `admin@charitychain.org`
   * **Password:** `Admin123456!`
4. Access the Super Admin console at `/admin` and Users & Roles directory at `/admin/users`.

---

## 2. Navigation Sections

1. **Overview (`/admin`)**: Operational snapshot across monetary donations, physical-goods valuation, available/committed/disbursed balances, pending student applications, inventory stock/low-stock alerts, active users, unresolved anomalies, and integration health. Overview counts link to their owning operational workspace without granting bypass/approval powers.
2. **Users and Roles (`/admin/users`)**: Manage user access across all **14 roles** (`SUPER_ADMIN`/`SYSTEM_ADMIN`, `ADMINISTRATOR`, `DONOR`, `STUDENT`, `CLERK`, `PHARMACY_CUSTODIAN`, `INVENTORY_SUPERVISOR`, `SUBGROUP_REP`, `COMMITTEE_MEMBER`, `TREASURER`, `SIGNATORY`, `FINANCE_OPERATOR`, `MEMBER_AUDITOR`, `AUDITOR`) and **55 assignable permissions**.
3. **Invitations**: Create staff accounts (`POST /api/v1/users/staff` or `POST /api/v1/users`) with role bundles and single-use expiring activation credentials; invited staff change temporary passwords on first sign-in and configure mandatory TOTP MFA when holding sensitive roles (`COMMITTEE_MEMBER`, `TREASURER`, `SIGNATORY`).
4. **Committee Membership**: Appoint/retire committee seats and signatory rosters with effective dates, quorum enforcement, and conflict-of-interest records without rewriting historical decisions.
5. **Contributions**: Read-only operational oversight of money & physical donations, confirmations, `MLK-XXXX-XXXX` receipts, FIFO allocations, reversals, and reconciliation outcomes (cannot manually forge or alter settled inflows).
6. **Students (`/admin/university`)**: Manage simulated university records (`CTxxx/xxxxxx/yy`, e.g. `CTxxx/xxxxxx/yy` or `CT201/000001/23`), programmes, fee balances, payment plans, HELB/scholarship entries, exam blocks, and financial-block status with logged reason & before/after versioning. These records are simulated prototype data, not a live university ERP link.
7. **Assistance and Vetting**: Inspect application volumes, Need-Index vetting explanations, duplicate checks, pending reviews, and appeals without substituting committee decisions.
8. **Inventory (`/admin/inventory`)**: Configure accepted physical categories, units, per-category limits, storage locations, expiry handling, low-stock thresholds, and approved valuation rules. Adjustments always require a logged reason.
9. **Goods Collection Policy**: Configure student eligibility rules, collection frequencies, category/total limits, and reservation expiries while preserving independent student handover confirmation.
10. **Policies (`/admin/policies`)**: Versioned configuration for recognition tier thresholds, Need-Index weights, assistance limits, committee thresholds, cash-handling rules, and public-transparency toggles (strictly prospective—never alters historical decisions).
11. **Integrations (`/admin/integrations`)**: Monitor health and queue/callback state for M-Pesa Daraja, Bank gateway, SMS, Resend email, IPFS Kubo, Polygon/Hardhat RPC, and Chainlink automation without exposing credentials. Admins can pause an unsafe integration or trigger follow-up without altering approved payout amounts/destinations.
12. **Transparency and Recognition**: Configure public dashboard metrics and tier thresholds (`Bronze/Silver/Gold/Patron/Consistent Giver` + institutional tiers) while maintaining `ANONYMOUS` default privacy and redacting private student/donor contact details.
13. **Notifications**: Manage templates for invitations, security events, role changes, donation confirmations, and operational alerts without leaking secret tokens.
14. **Audit and Security (`/admin/security`)**: Search immutable audit logs, monitor anomaly counts and active sessions, enforce MFA compliance, revoke compromised sessions, suspend accounts, or pause operations; cannot erase audit records.
15. **Reports**: Export privacy-filtered operational, contribution, support, reconciliation, inventory, and audit summaries under permission and audit controls.

---

## 3. Governance Boundaries (Enforced in Code)

* Administrators manage access, schema configuration, and operational readiness; they **cannot** approve student applications/cases (`case:decide`) or sign/execute fund releases (`release:authorize`, `disbursement:execute`).
* Committee decisions require quorum separation and distinct approvers; release authorization requires 2-of-3 EIP-712 `SIGNATORY` wallets.
* Donor and student physical confirmations cannot be overridden into acceptance by staff or administrators.
* Audit logs, `case_events`, `allocations`, and `donation_raw_callbacks` are protected by PostgreSQL append-only triggers and cannot be deleted or edited through the admin console.
