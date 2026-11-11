# CharityChain System Dashboards

This document defines the public pages, role-based dashboards, workflow states, permitted actions, privacy boundaries, and operational responsibilities for CharityChain.

## 1. Public Website

These pages are available without authentication.

### 1.1 Home Page

Purpose: Introduce CharityChain and provide direct access to donations, assistance information, and public transparency.

Content:

- Total confirmed monetary donations
- Total verified physical donations
- Total reconciled disbursements
- Number of students supported
- Number of goods distributed
- Current campaigns and urgent needs
- Donate Money and Donate Goods actions
- Recent anonymized system activities
- Explanation of the two-out-of-three committee approval process
- Links to the transparency dashboard

Only confirmed and reconciled figures may be published.

### 1.2 How CharityChain Works

The page explains both principal flows.

Money flow:

`Donor -> Central Fiat Account -> Student Needs Vetting -> Committee Approval -> University or Student -> Reconciliation`

Physical-goods flow:

`Donor -> Clerk Records Goods -> Donor Confirms -> Inspection and Inventory -> Student Eligibility Check -> Student Confirms Collection -> Goods Released`

Blockchain provides a tamper-evident audit trail. Actual payments remain within M-Pesa, Paybill, and banking systems.

### 1.3 Public Transparency Dashboard

Purpose: Provide public accountability without exposing private donor or student information.

Sections:

- Confirmed inflows and reconciled outflows
- Available, committed, and disbursed funds
- Donation totals by reporting period
- Allocations by assistance category
- Tuition and upkeep disbursement summaries
- Goods received and distributed by category
- Pending, approved, declined, and completed assistance cases
- Anonymized activity timeline
- Resolved audit findings
- Quarterly transparency reports
- Donor recognition board

The dashboard must never expose student names, registration numbers, phone numbers, balances, private records, or committee deliberations.

### 1.4 Public Donor Recognition Board

Displayed information may include:

- Donor-selected public identity
- Recognition tier
- Optional contribution category
- Optional cumulative contribution
- Contribution date or period
- Monetary, goods, or combined-contributor badge

Privacy rules:

- Every donor receives a unique generated alias at registration.
- The alias is displayed by default.
- Donors may edit their alias, subject to uniqueness and moderation.
- Donors may explicitly choose to show their real name.
- Donors may hide their name, totals, tier, or entire public listing.
- Public preference changes do not alter historical audit records.

Recognition tiers are Silver, Gold, Diamond, and Platinum. Thresholds must be configurable. Physical goods count toward tiers only under an approved valuation policy; separate money and goods badges may be used.

### 1.5 Track My Donation

The donor supplies a private tracking ID and an additional verification value where required.

The result may show:

- Donation type, date, and status
- Confirmed amount or item summary
- Campaign or assistance pool
- Allocation status
- Anonymized supported category
- Disbursement or distribution status
- Reconciliation evidence
- Audit timeline

A guessed or leaked tracking ID must not reveal protected donor or student information.

### 1.6 Available Goods Catalogue

This page shows:

- Goods categories
- Available, limited, or unavailable status
- General eligibility requirements
- Collection centre and opening hours
- Maximum permitted quantities
- Explanation of the collection process

Sensitive or high-value stock counts remain restricted.

### 1.7 Governance and Policy Pages

- About CharityChain and CharityChain
- Committee and governance structure
- Donation and assistance policies
- Eligibility and goods-valuation policies
- Privacy notice and terms of use
- Complaints and appeals
- Contact and support
- Fraud-reporting channel

### 1.8 Registration and Login

Public users may register as donors/general users or students. Clerk, committee, finance, auditor, and administrator roles must be assigned by an authorized administrator and cannot be self-selected.

## 2. Donor and General-User Dashboard

### 2.1 Dashboard Overview

- Confirmed monetary donations
- Verified physical contributions
- Current recognition tier and progress to the next tier
- Active tracking records
- Recent donation statuses
- Public identity setting
- Impact summary
- Donate Money, Donate Goods, Track Donations, Receipts, and Identity Settings actions

### 2.2 Donate Money

1. Select a campaign, purpose, or unrestricted central pool.
2. Enter an amount.
3. Select M-Pesa, Paybill, or a supported bank method.
4. Review details and charges.
5. Confirm the donation request.
6. Complete provider authorization.
7. See a pending-confirmation screen.
8. Receive a tracking ID after verification.

Payment states are Initiated, Awaiting Confirmation, Confirmed, Failed, Reversed, and Reconciled.

### 2.3 Donate Physical Goods

The donor may declare an intended donation using goods categories, estimated quantities, preferred delivery date, contact number, and optional notes. This declaration is not a completed donation. The clerk records the goods actually delivered, and the donor confirms the exact entry independently.

### 2.4 Donation History and Details

Each record shows:

- Tracking ID
- Donation type and date
- Amount or item summary
- Confirmation, allocation, and reconciliation status
- Receipt
- Public-display preference
- Reversal or exception status
- Anonymized impact information

For pooled funds, the interface says that funds were allocated rather than claiming that the donor's exact currency reached one beneficiary.

### 2.5 Public Identity and Recognition Settings

The donor controls the generated alias, edited public alias, real-name toggle, full public-listing opt-out, visibility of contribution totals, visibility of tier, and notification preferences. A preview shows exactly what the public will see.

### 2.6 Receipts, Statements, and Notifications

Donors can view and download receipts and contribution statements, verify receipt authenticity, and see money and goods valuations separately. Notifications cover confirmations, corrections, allocations, distributions, tier changes, and suspicious account activity.

## 3. Student Dashboard

### 3.1 Student Overview

- Current eligibility status
- Fee balance from the simulated university database
- Active assistance request and latest decision
- Goods eligibility and remaining allowance
- Upcoming collection information
- Notifications

The system must not label students simply as poor or non-poor.

### 3.2 University Record View

The student can view their registration number, programme, academic status, fee balance, payment history, HELB or scholarship entries, finance blocks, and relevant semester. Students cannot edit authoritative mock records but may report an error.

### 3.3 Financial-Assistance Application

The student selects tuition or upkeep assistance, the semester, a requested amount where policy permits, and required declarations. The prototype uses the simulated university database; students do not upload fee statements.

### 3.4 Needs-Vetting Result

The assessment considers:

- Unmet fee balance
- Fragmented micro-payment history
- Repeated late payments near examination periods
- Historical finance blocks
- HELB or scholarship reliance
- Remaining funding gap
- Previous assistance
- Duplicate or conflicting requests

Possible results are Eligible for Committee Review, Additional Review Required, Currently Ineligible, Duplicate Request, Record Discrepancy, Approved, Declined, and Disbursed. Students receive understandable reasons and an appeal route.

### 3.5 Assistance Timeline

`Submitted -> Record Checked -> Vetted -> Committee Review -> Approved or Declined -> Payment Initiated -> Payment Confirmed -> Reconciled`

### 3.6 Goods Catalogue and Allowance

Students see available categories, eligibility, allowed quantity per category, maximum categories, previous collections, next eligible date, and collection-centre information.

Example configurable limits:

- Maximum four categories per collection
- Sanitary pads: three packs
- Tissue: four rolls
- Soap: two units
- Toothpaste: one tube

### 3.7 Goods Request and Collection Confirmation

The system checks eligibility, stock, limits, collection frequency, previous collections, and unresolved discrepancies. Reservations expire if not collected on time.

At collection:

1. The clerk identifies the student and retrieves the allowance.
2. The student selects permitted available goods.
3. The clerk enters the exact quantities.
4. The system sends the student a confirmation message.
5. Yes commits the distribution and reduces inventory.
6. The clerk releases the goods only after confirmation.
7. No rejects the proposal and requires correction.

Rejected attempts remain in a restricted audit log. Inventory is reserved while confirmation is pending.

### 3.8 Appeals and Support

Students can appeal eligibility decisions, report inaccurate records or collection discrepancies, report goods withheld after confirmation, request support, and track complaints.

## 4. Physical-Donations and Inventory Clerk Dashboard

### 4.1 Clerk Overview

- Donations awaiting donor confirmation
- Confirmed goods received today
- Rejected entries requiring correction
- Pending student collections
- Low stock and expiring reservations
- Inventory discrepancies
- Cash awaiting deposit confirmation

### 4.2 Record Incoming Physical Donations

The clerk records the donor reference, goods or cash type, categories, quantities, condition, relevant batch or expiry date, approved estimated value, receiving date and location, and notes. Submission creates an `AWAITING_DONOR_CONFIRMATION` record rather than confirmed inventory.

### 4.3 Donor Confirmation

- Yes confirms the entry and sends goods to inspection or inventory.
- No rejects it and requires a corrected version.
- Expired leaves it unconfirmed for follow-up.
- Unable to Confirm requires an authorized exception process.

The clerk cannot submit the donor's answer. Rejected attempts remain auditable.

### 4.4 Inspection and Acceptance

Goods may be Accepted, Rejected, Quarantined, Damaged, Expired, Unsafe, or Awaiting Supervisor Review. Only accepted goods become available inventory.

### 4.5 Physical Cash Handling

`Donor Confirmed -> Cash Held -> Deposit Pending -> Deposit Matched -> Reconciled`

Cash becomes available funding only after it is matched to a central-account deposit.

### 4.6 Inventory Management

The system tracks category, item, quantities received, reserved, distributed, damaged or expired, available balance, storage location, batch, expiry date, and low-stock status. Every adjustment requires a reason and audit event.

### 4.7 Student Collection Processing

1. Search by registration number and confirm identity.
2. View eligibility and remaining allowance.
3. Select permitted goods and validate limits.
4. Submit the proposed distribution.
5. Wait for independent student confirmation.
6. Release the goods and issue a receipt only after confirmation.

The clerk cannot override eligibility or limits without an authorized exception.

### 4.8 Daily Reconciliation

The clerk compares opening inventory, confirmed donations, accepted goods, distributions, damaged or rejected goods, closing inventory, physical count, and variance. A supervisor reviews unresolved differences.

## 5. Committee Approval Dashboard

This dashboard serves the three authorized committee approvers.

### 5.1 Committee Overview

- Applications awaiting review
- Applications with one approval
- Fully approved and declined applications
- Approved funds awaiting payout
- Failed payouts requiring review
- Available and committed funds
- Conflicts and anomalies

### 5.2 Application Review Queue and Detail

Members filter by assistance type, semester, need level, amount, approval count, date, risk flag, and available funding. The application view provides a pseudonymized student reference, institutional status, balance, payment patterns, exam-period history, HELB or scholarship entries, remaining gap, previous assistance, vetting explanation, requested and recommended amounts, duplicate checks, and available funds.

### 5.3 Approval Action

Members may Approve, Decline, Abstain for Conflict, Request Review, or add a controlled note. Each decision is bound to the application, exact amount, purpose, destination type, semester, expiry, and unique authorization number.

The first distinct approval produces `1_OF_2_APPROVALS`; the second produces `APPROVED_FOR_DISBURSEMENT`. Changes to the student, amount, purpose, or destination invalidate earlier approvals.

### 5.4 Funding and Approval History

Members see decision timestamps, approval count, recusals, renewed-approval requirements, expired approvals, payout results, available balance, committed funds, pending disbursements, failed payouts, and restricted campaign balances.

## 6. Payment Operations Dashboard

This dashboard is restricted to authorized finance or payment operators.

### 6.1 Approved Disbursements

It lists authorized university Paybill or bank tuition payments and M-Pesa B2C upkeep payments.

### 6.2 Payout States

`AUTHORIZED -> SUBMITTED -> PROVIDER_ACCEPTED -> CALLBACK_RECEIVED -> CONFIRMED -> RECONCILED`

Exception states are Failed, Timed Out, Rejected, Reversed, Manual Review, and Destination Mismatch.

### 6.3 Reconciliation and Exceptions

The operator matches the approved and submitted amounts, provider transaction ID, student or university reference, callback, status-query result, settlement record, and central-account movement. A payment is publicly completed only after verification. Operators cannot change an approved amount or destination; material changes return to committee review.

## 7. Forensic Auditor Dashboard

### 7.1 Audit Overview

Indicators include unreconciled inflows and outflows, duplicate callbacks or applications, failed confirmations, unusual clerk activity, excessive inventory adjustments, disbursement spikes, reused confirmation numbers, approval conflicts, and cash-deposit mismatches.

### 7.2 Money and Goods Audits

The money audit compares opening balance, confirmed inflows, charges, commitments, payouts, reversals, and closing balance. The goods audit compares goods received, accepted, distributed, damaged or expired, closing inventory, physical count, and variances.

### 7.3 Investigation Cases

Each case contains the detection rule, evidence, investigator, status, notes, resolution, and corrective action.

`DETECTED -> TRIAGED -> INVESTIGATING -> CONFIRMED or DISMISSED -> RESOLVED`

Only reviewed and anonymized findings may be published.

### 7.4 Immutable Audit Timeline

Auditors verify donation confirmations, application decisions, committee approvals, payout evidence, inventory receipts, student collections, corrections, and reversals against blockchain evidence. Blockchain holds hashes and major state transitions, not private raw records.

## 8. Administrator Dashboard

Administrators manage access and configuration but cannot unilaterally approve or release funds.

### 8.1 Users and Roles

- Create staff accounts
- Assign clerk, committee, finance, or auditor roles
- Suspend accounts and securely reset access
- Review account activity
- Rotate committee membership through an authorized process

Administrators cannot silently impersonate donors or students.

### 8.2 Policy Configuration

- Recognition-tier thresholds
- Goods category and quantity limits
- Collection-frequency limits
- Vetting weights and thresholds
- Committee approval threshold
- Assistance periods
- Cash-handling and valuation rules
- Notification templates
- Public-dashboard settings

Sensitive changes require authorization and audit events.

### 8.3 Mock University Records

Authorized staff manage student profiles, academic status, fee balances, payment history, exam dates and finance blocks, HELB or scholarship entries, and assistance history. Every change requires a reason, actor, timestamp, and retained previous version.

### 8.4 Inventory and Integration Configuration

Administrators define goods categories, units, limits, inspection rules, expiry handling, storage locations, and valuation rules. They also monitor M-Pesa, SMS, bank gateway, blockchain/RPC, IPFS, callbacks, and reconciliation delays.

### 8.5 Security and Incidents

- View security alerts
- Suspend affected operations
- Revoke compromised sessions
- Pause new payouts
- Review access logs
- Record incident actions
- Start recovery procedures

## 9. Shared Authenticated Pages

- Profile
- Password and account security
- Notification preferences
- Help and support
- Privacy settings
- Activity history
- Logout
- Access denied
- Maintenance
- Confirmation expired
- Transaction pending
- Error and recovery guidance

## 10. Portal Organization

1. **Public Portal:** Home, transparency, recognition, tracking, and policies.
2. **Community Portal:** Donor and student dashboards.
3. **Operations Portal:** Clerk, inventory, and payment operations.
4. **Governance Portal:** Committee, auditor, and administrator dashboards.

The portals may be delivered through one React application with role-based navigation. All permissions must also be enforced by the backend because hiding a menu item in React is not sufficient security.
