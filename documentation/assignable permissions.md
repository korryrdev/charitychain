# Assignable Permissions Catalogue

This is the complete permission catalogue currently defined by the CharityChain backend in `backend/src/constants/permissions.js`. The redesigned **Users and roles** workspace must display these permissions as the authoritative selectable capabilities; a dashboard must only expose actions that the recipient's server-issued permissions allow.

## 1. Personal Account Access

| Permission | What it permits |
| --- | --- |
| `profile:read:self` | Read the signed-in person's own account profile. |
| `profile:update:self` | Update the signed-in person's own account profile. |

## 2. Money and Donor Contributions

| Permission | What it permits |
| --- | --- |
| `donation:create` | Create a money-donation request. |
| `donation:read:self` | View only the signed-in donor's own donation records and receipts. |
| `donation:read:all` | View system-wide money-donation records for authorized operations or audit work. |

## 3. Physical Donations and Confirmations

| Permission | What it permits |
| --- | --- |
| `physical-donation:record` | Record physical goods or cash actually received at the desk. |
| `physical-donation:inspect` | Inspect a donor-confirmed physical donation and record the inspection outcome. |
| `confirmation:manage` | Issue, monitor, retry, and manage independent donor or student confirmation workflows. This does not permit confirming on someone else's behalf. |

## 4. Inventory and Goods Distribution

| Permission | What it permits |
| --- | --- |
| `inventory:read` | View stock, batches, availability, reservations, and expiry-related inventory information. |
| `inventory:manage` | Create controlled inventory categories or locations, receive accepted goods into stock, make reasoned adjustments, manage reservations, and record stock counts. |
| `goods-collection:record` | Record a student's requested or actual goods handover. |
| `goods-collection:release` | Release goods only after the required student confirmation and eligibility controls have passed. |

## 5. Student Records and Support Applications

| Permission | What it permits |
| --- | --- |
| `student-record:read:self` | View the signed-in student's own simulated university record. |
| `student-record:read:all` | View university records for authorized operational review. |
| `student-record:manage` | Manage authorized simulated-university record data under audit controls. |
| `application:create` | Create a student-support application for the signed-in student. |
| `application:read:self` | View the signed-in student's own applications, vetting results, and decisions. |
| `application:review` | Review eligible support applications without approving or paying them. |

## 6. Vetting and Committee Governance

| Permission | What it permits |
| --- | --- |
| `vetting:execute` | Run the explainable financial-need and duplication checks for an application. |
| `vetting-policy:manage` | Create or manage versioned vetting policy configurations, factor weights, and thresholds. |
| `application:approve` | Record a committee approval or decision within the multi-signatory rule; it does not unilaterally release money. |
| `committee:manage` | Manage authorized committee membership, seats, conflicts, and historical governance records. |

## 7. Disbursement and Reconciliation

| Permission | What it permits |
| --- | --- |
| `disbursement:create` | Create a payout only from a committee-approved application. |
| `disbursement:execute` | Execute an approved payout through the configured fiat payment flow. |
| `disbursement:read` | View payout records, provider states, and payout evidence. |
| `reconciliation:execute` | Run money or operational reconciliation actions. |
| `reconciliation:read` | View reconciliation records, exceptions, and outcomes. |

## 8. Evidence, Audit, and Forensics

| Permission | What it permits |
| --- | --- |
| `evidence:read` | View authorized receipt, IPFS, and tamper-evident evidence references. |
| `audit:read` | View immutable audit-log entries. |
| `forensics:read` | View forensic anomalies, rules, and cases. |
| `forensics:investigate` | Open, investigate, and update a restricted forensic case. |
| `report:read` | View authorized reports. |
| `report:generate` | Generate privacy-filtered operational, contribution, support, reconciliation, inventory, or audit reports. |

## 9. Complaints and Operational Administration

| Permission | What it permits |
| --- | --- |
| `complaint:create` | Submit a complaint, appeal, or fraud report. |
| `complaint:manage` | Review and manage submitted complaints and appeals. |
| `policy:manage` | Manage controlled operational policies outside the vetting-policy scope. |
| `role:manage` | Create, update, and assign permission roles. High-risk role changes must require MFA and an audit event. |
| `user:manage` | Manage staff accounts, account status, and user access. High-risk actions must require MFA and an audit event. |
| `system:administer` | Access super-administration functions and system-wide operational oversight. It must not bypass independent confirmations, committee thresholds, payout controls, reconciliation, or immutable audit evidence. |

## Permission-Composition Rules for the Redesign

1. The administrator selects only from the permissions above; the interface must not invent client-only permissions.
2. The administrator gives the selected bundle a clear role name and description before assigning it.
3. The recipient is assigned one or more named roles. Their dashboard navigation is derived from the combined server-issued permission set, while every API action remains server-authorized.
4. A recipient can never grant themselves a permission, change their assigned role, approve their own support request, confirm on behalf of a donor or student, or bypass the committee and reconciliation rules.
5. Creating an access role, assigning it, suspending it, or changing its permissions requires MFA, an explicit reason, and an immutable audit event.
6. Temporary invitation credentials must be delivered only to the intended email address through a configured mail provider in a production deployment; the local prototype must clearly show its development-only setup details and must not pretend that an external email was sent.

## Existing Built-in Role Bundles

The current seed data contains these standard roles: `DONOR`, `STUDENT`, `CLERK`, `INVENTORY_SUPERVISOR`, `COMMITTEE_MEMBER`, `FINANCE_OPERATOR`, `AUDITOR`, and `ADMINISTRATOR`. The redesigned access workspace will retain these as starting bundles while allowing an administrator to compose a new named permission bundle from the catalogue above.
