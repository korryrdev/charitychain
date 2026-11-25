# Super Admin Setup

This document defines the CharityChain super-admin dashboard before implementation. The super administrator manages access, configuration, operational oversight, and safeguards, but cannot override the independent committee-approval, confirmation, reconciliation, or audit controls that protect the system.

## 1. Overview

The overview provides the operational picture of the platform:

- Total confirmed money contributions and verified physical-goods value.
- Available funds, committed funds, disbursed funds, and reconciled versus unreconciled amounts.
- Students assisted, pending applications, committee decisions awaiting payout, and recent support activity.
- Available inventory, low-stock items, goods collections, active users, unresolved anomalies, and integration health.

Overview figures link to their responsible operational section. The overview does not replace the underlying controls or grant approval and payout powers.

## 2. Users and Roles

The super administrator can manage user access through a searchable directory showing:

- Name, email address, account status, assigned roles, MFA status, last activity, and invitation state.
- Secure staff-account creation and invitation.
- Account suspension, reactivation, secure access reset, session revocation, and account-activity review.

The role selector contains all defined roles:

1. Super Administrator
2. Administrator
3. Donor
4. Student
5. Clerk
6. Inventory Supervisor
7. Committee Member
8. Finance Operator
9. Auditor

Every role change requires confirmation, a reason, and an immutable audit event. No administrator may silently impersonate another user or create unaudited staff access.

## 3. Staff Invitations and Access Setup

The super administrator enters a staff member's name and email, selects one or more roles, and sends a single-use invitation with an expiry time. The invited staff member completes secure activation, changes their temporary password on first sign-in, and must set up MFA when the assigned role is sensitive. Once active, they see only the dashboard areas and actions allowed by their roles.

## 4. Committee Membership

This area manages the authorized committee membership used for the two-of-three approval workflow:

- Appoint and remove members with effective start and end dates.
- Show current and historical committee membership.
- Enforce approval quorum and conflict-of-interest rules.
- Retain prior decisions and approval evidence when membership changes.

Committee membership management never changes a historical approval, and an administrator cannot approve a student request in place of committee members.

## 5. Donor and Contribution Oversight

This is a controlled, read-only operational view of money and physical donations, confirmations, receipts, allocations, reversals, reconciliation results, and private tracking records. It provides aggregate trends by channel, campaign, period, and status. The super administrator may investigate exceptions but cannot rewrite confirmed donation history or manually mark funds as received.

## 6. Student and Simulated University Records

Authorized administrators manage the prototype's simulated university data:

- Registration number, programme, school, academic status, and year of study.
- Fee balance, payment history, exam restrictions, finance blocks, and assistance history.
- HELB and scholarship records.

Every change requires a reason, an actor, a timestamp, and a retained before-and-after version. This remains simulated prototype data; it does not represent a live university-database connection.

## 7. Student Assistance and Vetting Oversight

The dashboard shows application volume, vetting outcomes, need-index explanations, duplicate checks, pending reviews, approved support, declined cases, and appeals. The super administrator controls access and policy configuration but cannot replace the committee's independent approval decision.

## 8. Inventory Configuration and Oversight

The super administrator manages:

- Accepted goods categories, item names, units, and per-category limits.
- Storage locations, expiry handling, inspection requirements, and low-stock thresholds.
- Approved valuation rules for goods and recognition.
- Stock received, reserved, released, damaged, expired, adjusted, and physically counted.

Every inventory adjustment requires a reason and an audit event. Only donor-confirmed and inspection-accepted physical goods may enter available inventory.

## 9. Goods-Collection Policy

This section configures collection frequency, category and total-item limits, reservation duration, and eligibility rules. It also shows requests, pending confirmations, released goods, rejected confirmations, expired reservations, and collection history. A student must independently confirm the clerk-recorded handover before inventory is permanently reduced.

## 10. Policies and Governance Configuration

Versioned policies include:

- Recognition tier thresholds.
- Need-index weights and thresholds.
- Assistance limits and periods.
- Committee approval threshold.
- Cash-handling, payment-destination, and goods-valuation rules.
- Goods collection limits and retention rules.
- Public-transparency settings.

Every policy change requires authorization, a reason, an audit record, and prospective application. Historical decisions are never rewritten.

## 11. Payments, Reconciliation, and Integration Health

The super administrator monitors M-Pesa, Paybill, bank gateway, SMS, IPFS, blockchain/RPC, callback processing, and reconciliation delays. The view includes provider health, failed callbacks, unmatched deposits, payout exceptions, retries, and sandbox/live integration state without exposing credentials. The administrator may pause an unsafe integration or escalate an exception but cannot bypass committee approval or alter an approved payout amount or destination.

## 12. Recognition and Public Transparency

This section configures Silver, Gold, Diamond, and Platinum thresholds, approved physical-goods valuation, public aliases, recognition opt-out behavior, and public-dashboard rules. It previews only anonymized, reconciled data. Private student records, donor contact details, fee balances, application evidence, and committee deliberations must never be exposed publicly.

## 13. Notifications and Communication Templates

The super administrator manages approved templates for staff invitations, account-security events, role changes, donation confirmations, physical-goods confirmations, goods-collection confirmations, and operational alerts. Delivery status and failures are visible without exposing confirmation tokens or private secrets.

## 14. Audit, Forensics, and Security

The dashboard provides a searchable, immutable history for role changes, policy changes, account suspension, inventory adjustments, payout exceptions, confirmation failures, and access revocation. It also shows integrity checks, anomaly counts, investigation status, security incidents, session activity, MFA compliance, and restricted exports. The super administrator may assign investigations or lock access but cannot erase audit evidence.

## 15. Reports and Controlled Exports

Authorized reports cover contribution totals, student assistance, committee decisions, payout reconciliation, inventory, goods collections, audit activity, and operational health. Exports are permission-checked, privacy-filtered by default, and audit-logged.

## Navigation

The super-admin left navigation is:

1. Overview
2. Users and roles
3. Invitations
4. Committee membership
5. Contributions
6. Students
7. Assistance and vetting
8. Inventory
9. Goods collection
10. Policies
11. Integrations
12. Transparency and recognition
13. Notifications
14. Audit and security
15. Reports

## Governance Boundaries

- Administrators manage access and configuration; they cannot unilaterally approve assistance or release funds.
- Committee decisions remain subject to the configured multi-signatory rule.
- Confirmed donor and student confirmations cannot be edited into approval.
- Payment completion requires provider evidence and reconciliation.
- Audit records are append-only and cannot be deleted through the dashboard.
