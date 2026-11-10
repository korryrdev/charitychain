# CharityChain Frontend Breakdown

This is the implementation checklist for the React frontend. It follows the approved project structure and the dashboard specification. Each section is completed only when its UI, API behavior, access rules, loading/error states, accessibility, and tests are verified.

## 1. Frontend Root and Tooling

```text
frontend/
├── .env.example
├── package.json
├── vite.config.js
├── index.html
├── public/
└── src/
```

Responsibilities: Vite build configuration, environment-safe API URL configuration, package scripts, public metadata, production build, and frontend test commands.

## 2. Application Bootstrap

```text
src/
├── main.jsx
├── App.jsx
└── app/
    ├── providers.jsx
    ├── router.jsx
    ├── routeConfig.js
    ├── queryClient.js
    ├── StartupGate.jsx
    └── ErrorBoundary.jsx
```

Responsibilities: mount React, compose providers, restore a session safely, configure routes, initialize API caching, catch rendering errors, and present startup/recovery states.

## 3. Global Styling, Accessibility, and Utilities

```text
src/assets/styles/global.css
src/accessibility/
src/utils/
src/constants/
src/hooks/
src/validation/
```

Responsibilities: design tokens, responsive layout rules, keyboard navigation, focus management, screen-reader labels, date/currency formatting, masked values, status labels, pagination, debounced inputs, and shared client-side validation.

## 4. Shared Component System

```text
src/components/
├── common/       Button, Card, Modal, Pagination
├── forms/        FormField, PhoneField, SelectField
├── feedback/     Alert, EmptyState, ErrorState, LoadingState
├── navigation/
├── privacy/      MaskedValue
├── status/       StatusBadge
├── tables/       DataTable
└── charts/       MetricChart
```

Responsibilities: consistent accessible controls, form errors, confirmation dialogs, pagination, loading/empty/error handling, privacy masking, workflow status display, tables, and charts.

## 5. HTTP, Security, and Client State

```text
src/services/
├── httpClient.js
├── csrf.js
├── requestId.js
├── errorMapper.js
└── downloadClient.js
src/store/
├── auth.store.js
├── notification.store.js
└── preferences.store.js
```

Responsibilities: cookie-based API calls, CSRF handling, request correlation, safe error mapping, authorized downloads, session state, notification state, and user interface preferences. No payment secret, database credential, blockchain private key, or provider credential belongs in the browser.

## 6. Authentication and Authorization

```text
features/authentication/
├── components/   LoginForm, RegisterForm, MfaForm
├── hooks/        useAuth, useSession
├── services/     auth.api.js
├── validation/   auth.schema.js
└── tests/
features/authorization/
├── components/   ProtectedRoute, PermissionGate
├── hooks/        usePermissions
├── permissions.js
└── tests/
pages/auth/
```

Responsibilities: donor/student registration, login, logout, verification, password recovery/reset, MFA challenge, session expiry, permission-aware routing, and access-denied handling. Staff roles are never self-selected, and server authorization remains authoritative.

## 7. Layouts and Portal Navigation

```text
layouts/
├── PublicLayout.jsx
├── AuthLayout.jsx
├── CommunityLayout.jsx
├── OperationsLayout.jsx
├── GovernanceLayout.jsx
└── components/ AppHeader, AppSidebar, Breadcrumbs, MobileNavigation, UserMenu
```

Responsibilities: responsive navigation and role-scoped portal shells:

1. Public portal: public pages and tracking.
2. Community portal: donor and student dashboards.
3. Operations portal: clerk, inventory, and finance work.
4. Governance portal: committee, auditor, and administrator work.

## 8. Public Website

```text
pages/public/
├── HomePage.jsx
├── HowItWorksPage.jsx
├── TransparencyPage.jsx
├── DonorRecognitionPage.jsx
├── TrackDonationPage.jsx
├── GoodsCataloguePage.jsx
├── GovernancePage.jsx
├── PoliciesPage.jsx
├── PrivacyPage.jsx
├── ContactPage.jsx
├── ComplaintPage.jsx
└── FraudReportPage.jsx
```

Responsibilities: publish reconciled and anonymized figures only; explain fiat money and physical-goods flows; expose public transparency, recognition, private tracking, catalogue limits, governance, policy, privacy, contact, complaint, and fraud-reporting pages.

## 9. Transparency and Public Recognition

```text
features/transparency/
├── components/ TransparencySummary, FundFlowChart, GoodsDistributionChart
├── services/transparency.api.js
└── tests/
features/recognitionTiers/
├── components/ RecognitionBoard, TierBadge, TierProgress
├── services/recognition.api.js
└── tests/
```

Responsibilities: public inflow/outflow charts, goods distribution, anonymized activity, reports, aliases, privacy-safe recognition tiers, opt-out behavior, and no exposure of donor or student protected data.

## 10. Donor Identity, Money Donations, and Receipts

```text
features/donorIdentity/
features/moneyDonations/
pages/donor/
├── DonorDashboardPage.jsx
├── DonateMoneyPage.jsx
├── DonationHistoryPage.jsx
├── DonationDetailPage.jsx
├── ReceiptsPage.jsx
├── PublicIdentityPage.jsx
└── DonorNotificationsPage.jsx
```

Responsibilities: generated alias preview/editing, real-name consent, visibility toggles, tier progress, M-Pesa/Paybill/bank donation initiation, pending/confirmed/reversed/reconciled states, tracking credentials, receipts, contribution history, and donor notifications.

## 11. Physical Donation Flow

```text
features/physicalDonations/
├── components/ PhysicalDonationForm, DonationLineEditor, ConfirmationStatus
├── services/physicalDonations.api.js
├── validation/physicalDonation.schema.js
└── tests/
pages/donor/DeclareGoodsPage.jsx
```

Responsibilities: donor intent declaration, clerk-recorded actual goods/cash, independent donor Yes/No confirmation, rejection/correction status, and a clear rule that only confirmed entries enter inventory or cash reconciliation.

## 12. Student Record, Application, and Vetting

```text
features/assistanceApplications/
features/studentVetting/
pages/student/
├── StudentDashboardPage.jsx
├── UniversityRecordPage.jsx
├── AssistanceApplicationPage.jsx
├── VettingResultPage.jsx
├── ApplicationTimelinePage.jsx
└── StudentAppealsPage.jsx
```

Responsibilities: read-only simulated university record, tuition/upkeep application, no document upload in the prototype, clear Need Index factors and explanations, record-discrepancy reporting, application status timeline, decisions, and appeal intake.

## 13. Student Goods Allowance and Collection

```text
features/goodsCollection/
├── components/ AllowanceSummary, GoodsSelector, CollectionConfirmation
├── services/goodsCollection.api.js
├── validation/goodsCollection.schema.js
└── tests/
pages/student/StudentGoodsPage.jsx
pages/student/GoodsRequestPage.jsx
pages/student/CollectionHistoryPage.jsx
```

Responsibilities: show eligible categories, remaining limits, collection history, stock availability, reservation expiry, and the student’s independent confirmation before goods are released.

## 14. Clerk and Inventory Operations

```text
features/inventory/
├── components/ InventoryTable, BatchInspector, StockMovementForm, StockVarianceAlert
├── services/inventory.api.js
└── tests/
pages/clerk/
```

Responsibilities: incoming physical donation entry, pending donor confirmations, inspection, cash-deposit status, accepted stock, batches, expiry, adjustments with reasons, collection processing, rejected transactions, daily reconciliation, and no clerk override of donor/student confirmations or collection limits.

## 15. Committee Review and Approvals

```text
features/committeeApprovals/
├── components/ ApprovalPanel, ApprovalProgress, ConflictDeclaration, DecisionForm
├── services/approvals.api.js
└── tests/
pages/committee/
```

Responsibilities: pseudonymized application queue, vetting evidence, conflict declaration, approve/decline/request-review actions, distinct two-of-three approval progress, invalidated approval states, commitments, and approval history.

## 16. Finance, Payouts, and Reconciliation

```text
features/disbursements/
├── components/ PayoutStatus, PayoutTimeline, ReconciliationEvidence
├── services/disbursements.api.js
└── tests/
pages/finance/
```

Responsibilities: approved tuition/upkeep payouts, provider states, exception queue, callback/status-query evidence, reconciliation, and a UI that prevents changing a committee-approved amount or destination.

## 17. Audit and Forensic Operations

```text
features/auditTrail/
features/forensicAnalytics/
pages/auditor/
```

Responsibilities: anomaly summaries, money/goods audit comparisons, investigation timeline, blockchain-hash verification, immutable event timeline, resolution evidence, and no public display of unreviewed private cases.

## 18. Administrator Operations

```text
pages/admin/
├── AdminDashboardPage.jsx
├── UsersAndRolesPage.jsx
├── PolicyConfigurationPage.jsx
├── MockUniversityDataPage.jsx
├── InventoryConfigurationPage.jsx
├── IntegrationHealthPage.jsx
└── SecurityIncidentsPage.jsx
```

Responsibilities: staff access, roles, policy configuration, simulated university data, inventory configuration, integration health, security incidents, session revocation, and operational pause controls; administrators cannot approve or release funds alone.

## 19. Complaints, Notifications, and Shared Account Pages

```text
features/complaints/
features/notifications/
pages/errors/
```

Responsibilities: complaints and appeals, restricted case status, notification preferences/listing, account/profile/security pages, forbidden/not-found/unavailable/unexpected-error states, pending transaction guidance, and confirmation-expired recovery.

## 20. Frontend Testing and Verification

```text
src/tests/
features/*/tests/
App.test.jsx
```

Verification must cover route protection, portal navigation, API error states, form validation, privacy masking, public-data safety, responsive/keyboard behavior, each donor/student/clerk/committee/finance/auditor/admin workflow, and production build success.

## Implementation Order

1. Sections 1–7: foundation, auth, authorization, layouts, and shared components.
2. Sections 8–11: public pages and donor money/goods flows.
3. Sections 12–14: student, vetting, goods, clerk, and inventory workflows.
4. Sections 15–18: committee, finance, forensic, and admin portals.
5. Sections 19–20: shared recovery/notifications and complete frontend verification.
