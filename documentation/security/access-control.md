# Access Control, Roles, and Permissions Catalogue

This specification unifies the Malkia PRD access matrix ([Product Requirements Document §4.2](../requirements/product-requirements-document.md#42-permission-matrix)) with the backend's authoritative role and permission catalogue ([roles.js](../../backend/src/constants/roles.js) and [permissions.js](../../backend/src/constants/permissions.js)). Frontend navigation is derived from server-issued permissions, while every API endpoint enforces authorization independently via `authenticate.js`, `authorize.js`, and `requireMfa.js`.

---

## 1. Unified Role Bundles (14 Roles)

### 1.1 Malkia Governance & Case Workflow Roles (PRD Section 4.1)

| Role Constant | Description | Mandatory 2FA (`FR-AUTH-01`) | Can Approve / Disburse Funds? |
| --- | --- | --- | --- |
| `SUBGROUP_REP` | Sub-group representative who drafts and submits student assistance cases | Optional | No (`case:create`, `case:submit`) |
| `COMMITTEE_MEMBER` | Main committee member reviewing and deciding cases/applications | **Required** | Case decisions & committee approval (`assertSegregation` vs submitter) |
| `TREASURER` | Records/verifies bank deposits and financial records | **Required** | Verifies bank deposits (`verifier !== entry creator`) |
| `SIGNATORY` | Executive Committee signatory holding a personal EIP-712 signing wallet (2-of-3 quorum) | **Required** | Release authorization via `CaseWorkflow` (`release:authorize`) |
| `PHARMACY_CUSTODIAN` | Logs physical donations at the campus pharmacy (`ITM` channel) | Optional | No |
| `MEMBER_AUDITOR` | Read-only Malkia member or external auditor inspecting anonymized logs & forensics | Optional | **Blocked in code (`FR-AUTH-03`)** |
| `SYSTEM_ADMIN` | Technical administrator provisioning accounts and deployments | Recommended | **Blocked in code (`FR-AUTH-03`)** |

### 1.2 Campus & Operational Portal Roles

| Role Constant | Portal Path | Primary Scope | Can Approve / Disburse Funds? |
| --- | --- | --- | --- |
| `DONOR` | `/donor`, `/donor/dapp` | Donate money/goods, claim receipts, manage public display consent | No |
| `STUDENT` | `/student` | View simulated university record, submit aid applications, request goods, appeal | No |
| `CLERK` | `/clerk` | Desk physical intake, inspect deliveries, release student collections after confirmation | No |
| `INVENTORY_SUPERVISOR` | `/inventory`, `/inventory/pharmacy` | Manage warehouse SKUs, batches, expiry, stock counts, and pharmacy issuance | No |
| `FINANCE_OPERATOR` | `/finance` | Execute committee-authorized disbursements and bank/M-Pesa reconciliation | Payout execution only (strictly `<= approved` amount) |
| `AUDITOR` | `/auditor` | Investigate anomalies, audit money/goods/chain hashes, generate reports | **Blocked in code (`FR-AUTH-03`)** |
| `ADMINISTRATOR` | `/admin`, `/admin/users` | Manage users, roles, simulated records, policies, integration health | **Blocked in code (`FR-AUTH-03`)** |

---

## 2. Code-Enforced Governance Invariants & Segregation of Duties

1. **Non-Financial Admin & Auditor Guard (`FR-AUTH-03`):** `canApproveOrDisburseFunds(role)` in [roles.js](../../backend/src/constants/roles.js) explicitly returns `false` for `SYSTEM_ADMIN`, `ADMINISTRATOR`, `MEMBER_AUDITOR`, and `AUDITOR`. Administrators cannot silently impersonate users, modify ledger history, approve student requests, or release payouts.
2. **Case Segregation (`FR-CASE-04`, `R03`):** A user who created or submitted a case cannot decide/approve that same case (`assertSegregation`).
3. **Bank Maker-Checker Segregation (`FR-INT-06`, `R04`):** A bank deposit entered by user A must be verified by a distinct user B before a `DonationLot` is provisioned.
4. **2-of-3 Signatory Quorum (`D5`, `FR-CASE-05`, `R10`):** Both off-chain service validation and `CaseWorkflow.sol` verify two **distinct** registered `SIGNATORY_ROLE` EIP-712 signatures with per-case nonces and expiry deadlines before disbursement is unlocked.
5. **Independent Physical Confirmations:** Clerks cannot submit Yes/No confirmations on behalf of donors or students; students must confirm handover before permanent stock deduction.
6. **Audited High-Risk Mutations:** Role composition/assignment, account suspension, threshold tuning, public-name takedowns (`FR-DON-16`), and masked donor-reference reveals (`FR-DON-15`) require MFA/reason where applicable and write immutable audit entries.

---

## 3. PRD Resource Permission Matrix (Section 4.2)

`C` create, `R` read, `U` update, `A` approve, `-` none.

| Resource | Donor | Subgroup Rep | Committee | Treasurer | Signatory | Pharmacy Custodian | Member / Auditor | Sys Admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Own donation trace | R | - | R | R | R | - | R | - |
| Public dashboard | R | R | R | R | R | R | R | R |
| Case (own sub-group) | - | C, R, U (draft) | R | R | R | - | R (redacted) | - |
| Case decision | - | - | A | - | - | - | - | - |
| Release authorization | - | - | - | - | A (2 of 3) | - | - | - |
| Disbursement record | - | - | C, R | C, R | R | - | R | - |
| Bank deposit entry | - | - | R | C, U | R | - | R | - |
| Bank deposit verification | - | - | - | A (`!=` creator) | - | - | - | - |
| In-kind item log | - | - | R | R | R | C, U | R | - |
| Forensic alerts | - | - | R, U (resolve) | R | R | - | R | - |
| Own display mode & badge | C, R, U | - | - | - | - | - | - | - |
| Public name (alias/named) | A (own preview) | - | R, takedown | - | - | - | R | - |
| Badge tier thresholds | - | - | C, U (2nd approval) | - | - | - | R | - |
| Masked donor identity | - | - | R (logged reveal) | R (logged reveal) | R (logged reveal) | - | R (masked) | - |
| User and role admin | - | - | - | - | - | - | - | C, U |

---

## 4. Complete Assignable Permissions Catalogue (55 Permissions)

Every permission string below matches `PERMISSIONS` in [permissions.js](../../backend/src/constants/permissions.js) and is selectable in the **Users and roles** Super Admin console (`/admin/users`).

### 4.1 Case Workflow, Bank Intake, In-Kind & Forensics (16 PRD Permissions)

| Permission | What it permits |
| --- | --- |
| `case:create` | Draft a new sub-group assistance case (`MalkiaCase`). |
| `case:read` | Inspect case details (including encrypted beneficiary context for authorized committee/signatory roles). |
| `case:update:draft` | Modify draft case fields prior to submission. |
| `case:submit` | Submit a draft case into committee review. |
| `case:decide` | Approve, reject, or request additional information on a submitted case (`!=` submitter). |
| `release:authorize` | Provide an EIP-712 signatory release signature (`CaseWorkflow` 2-of-3 quorum). |
| `bank-deposit:create` | Record a pending bank transfer deposit or import a bank statement CSV. |
| `bank-deposit:verify` | Verify a pending bank deposit (`!=` creator) and inspect reconciliation status. |
| `item-log:create` | Log incoming physical / pharmacy item donations (`ITM` unit). |
| `item:issue` | Issue in-kind stock directly against an authorized case. |
| `alert:read` | View R01–R20 forensic alerts, rules, and the 5-column Fund-Flow DAG. |
| `alert:resolve` | Triage, resolve, or dismiss forensic alerts with a mandatory note and tune rule thresholds within safe bounds. |
| `rules:manage` | Manage configurable forensic rule metadata and bounds. |
| `donor-identity:reveal` | Unmask a keyed donor reference with a required logged reason (`FR-DON-15`). |
| `recognition:moderate` | Execute a logged committee takedown of an abusive or impersonating public wall name (`FR-DON-16`). |
| `badge-tier:manage` | Propose or approve updates to donor recognition badge thresholds (`FR-DON-07`). |

### 4.2 Personal Account & Donor Contributions

| Permission | What it permits |
| --- | --- |
| `profile:read:self` | Read the signed-in person's own account profile. |
| `profile:update:self` | Update the signed-in person's own account profile. |
| `donation:create` | Create a money-donation request. |
| `donation:read:self` | View only the signed-in donor's own donation records and receipts. |
| `donation:read:all` | View system-wide money-donation records for authorized operations or audit work. |

### 4.3 Physical Donations, Confirmations & Inventory

| Permission | What it permits |
| --- | --- |
| `physical-donation:record` | Record physical goods or cash actually received at the desk. |
| `physical-donation:inspect` | Inspect a donor-confirmed physical donation and record the inspection outcome. |
| `confirmation:manage` | Issue, monitor, retry, and manage independent donor or student confirmation workflows (never confirming on someone else's behalf). |
| `inventory:read` | View stock, batches, availability, reservations, and expiry-related inventory information. |
| `inventory:manage` | Create inventory categories or locations, receive accepted goods into stock, record adjustments, and manage stock counts. |
| `goods-collection:record` | Record a student's requested or actual goods handover. |
| `goods-collection:release` | Release goods only after independent student confirmation and eligibility checks pass. |

### 4.4 Student Records, Vetting & Committee Operations

| Permission | What it permits |
| --- | --- |
| `student-record:read:self` | View the signed-in student's own simulated university record. |
| `student-record:read:all` | View simulated university records for authorized operational review. |
| `student-record:manage` | Manage authorized simulated-university record data under audit controls. |
| `application:create` | Create a student-support application for the signed-in student. |
| `application:read:self` | View the signed-in student's own applications, vetting results, and decisions. |
| `application:review` | Review eligible support applications without unilaterally approving or paying them. |
| `vetting:execute` | Run the explainable Need-Index financial-need and duplication checks. |
| `vetting-policy:manage` | Create or manage versioned vetting policy configurations, factor weights, and thresholds. |
| `application:approve` | Record a committee approval/decision within the multi-signatory rule. |
| `committee:manage` | Manage authorized committee membership, seats, conflicts, and historical governance records. |

### 4.5 Disbursement, Reconciliation, Evidence & Forensics

| Permission | What it permits |
| --- | --- |
| `disbursement:create` | Create a payout only from a committee-approved/authorized case or application. |
| `disbursement:execute` | Execute an approved payout through the configured fiat payment flow. |
| `disbursement:read` | View payout records, provider states, and payout evidence. |
| `reconciliation:execute` | Run money or operational reconciliation actions. |
| `reconciliation:read` | View reconciliation records, exceptions, and outcomes. |
| `evidence:read` | View authorized receipt, IPFS, and tamper-evident evidence references. |
| `audit:read` | View immutable audit-log entries. |
| `forensics:read` | View forensic anomalies, rules, and cases. |
| `forensics:investigate` | Open, investigate, and update a restricted forensic case. |
| `report:read` | View authorized reports. |
| `report:generate` | Generate privacy-filtered operational, contribution, support, reconciliation, inventory, or quarterly reports. |

### 4.6 Complaints & Operational Administration

| Permission | What it permits |
| --- | --- |
| `complaint:create` | Submit a complaint, appeal, or fraud report. |
| `complaint:manage` | Review and manage submitted complaints and appeals. |
| `policy:manage` | Manage controlled operational policies outside the vetting-policy scope. |
| `role:manage` | Create, update, and assign permission roles (requires MFA, reason, and audit event). |
| `user:manage` | Manage staff accounts, status, and user access (requires MFA, reason, and audit event). |
| `system:administer` | Super-administration operational oversight without bypassing approvals, payouts, reconciliation, or immutable logs. |

---

## 5. Permission-Composition Rules

1. Administrators compose roles exclusively from the **55 backend-defined permissions** above; client UI never invents client-only permissions.
2. Each user can hold one or more named roles; the effective session permission set is the union of assigned role permissions evaluated server-side.
3. Temporary staff invitation credentials must be delivered only through a configured mail provider (`RESEND_API_KEY`) in production; local environments explicitly surface development-only setup state without falsifying email delivery.
