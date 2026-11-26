# CharityChain Frontend Breakdown

This is the implementation checklist for the React frontend. It follows the approved project structure and the dashboard specification. Each section is completed only when its UI, API behavior, access rules, loading/error states, accessibility, and tests are verified.

## 1. Frontend Root and Tooling

```text
frontend/
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
└── src/
```

Responsibilities: Strict TypeScript (`allowJs: false`, 100% `.tsx`/`.ts`), Vite 8 + `@tailwindcss/vite` build configuration, `@/*` path aliasing, environment-safe API URL configuration, Vitest `jsdom` tests, and production bundle verification (`tsc --noEmit && vite build`).

## 2. Application Bootstrap & Theme Isolation

```text
src/
├── main.tsx
├── App.tsx
├── index.css                 CSS Cascade Layers (@layer) without Tailwind Preflight reset
└── app/
    ├── Providers.tsx         Portal session, theme context, React Query, I18n & auth store
    ├── Router.tsx            Unified router entry & guards
    ├── routeConfig.ts        Unified routes across 9 portals + .tsx DApp + /app/*
    ├── queryClient.ts
    ├── StartupGate.tsx
    ├── ErrorBoundary.tsx
    ├── auth/AuthContext.tsx
    ├── guards/RequireAuth.tsx
    └── theme/                Theme CSS / bootstrap utilities
```

Responsibilities: mount React 19 with `Plus Jakarta Sans` and `Inter` typography, compose unified providers without CSS Preflight collisions, synchronize `data-theme` and `.dark` theme tokens, restore sessions safely, configure unified routes, and catch rendering errors.

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
├── httpClient.ts
├── csrf.ts
├── requestId.ts
├── errorMapper.ts
└── downloadClient.ts
src/store/
├── auth.store.ts
├── notification.store.ts
└── preferences.store.ts
```

Responsibilities: cookie-based API calls, CSRF handling, request correlation, safe error mapping, authorized downloads, session state, notification state, and user interface preferences. No payment secret, database credential, blockchain private key, or provider credential belongs in the browser.

## 6. Authentication and Authorization

```text
features/authentication/
├── components/   LoginForm, RegisterForm, MfaForm
├── hooks/        useAuth, useSession
├── services/     auth.api.ts
├── validation/   auth.schema.ts
└── tests/
features/authorization/
├── components/   ProtectedRoute, PermissionGate
├── hooks/        usePermissions
├── permissions.ts
└── tests/
pages/auth/
```

Responsibilities: donor/student registration, login, logout, verification, password recovery/reset, MFA challenge, session expiry, permission-aware routing, and access-denied handling. Staff roles are never self-selected, and server authorization remains authoritative.

## 7. Layouts and Portal Navigation

```text
layouts/
├── PublicLayout.tsx
├── AuthLayout.tsx
├── CommunityLayout.tsx
├── OperationsLayout.tsx
├── GovernanceLayout.tsx
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
├── HomePage.tsx
├── HowItWorksPage.tsx
├── TransparencyPage.tsx
├── DonorRecognitionPage.tsx
├── TrackDonationPage.tsx
├── GoodsCataloguePage.tsx
├── GovernancePage.tsx
├── PoliciesPage.tsx
├── PrivacyPage.tsx
├── ContactPage.tsx
├── ComplaintPage.tsx
└── FraudReportPage.tsx
```

Responsibilities: publish reconciled and anonymized figures only; explain fiat money and physical-goods flows; expose public transparency, recognition, private tracking, catalogue limits, governance, policy, privacy, contact, complaint, and fraud-reporting pages.

## 9. Transparency and Public Recognition

```text
features/transparency/
├── components/ TransparencySummary, FundFlowChart, GoodsDistributionChart
├── services/transparency.api.ts
└── tests/
features/recognitionTiers/
├── components/ RecognitionBoard, TierBadge, TierProgress
├── services/recognition.api.ts
└── tests/
```

Responsibilities: public inflow/outflow charts, goods distribution, anonymized activity, reports, aliases, privacy-safe recognition tiers, opt-out behavior, and no exposure of donor or student protected data.

## 10. Donor Identity, Money Donations, and Receipts

```text
features/donorIdentity/
features/moneyDonations/
pages/donor/
├── DonorDashboardPage.tsx
├── DonateMoneyPage.tsx
├── DonationHistoryPage.tsx
├── DonationDetailPage.tsx
├── ReceiptsPage.tsx
├── PublicIdentityPage.tsx
└── DonorNotificationsPage.tsx
```

Responsibilities: generated alias preview/editing, real-name consent, visibility toggles, tier progress, M-Pesa/Paybill/bank donation initiation, pending/confirmed/reversed/reconciled states, tracking credentials, receipts, contribution history, and donor notifications.

## 11. Physical Donation Flow

```text
features/physicalDonations/
├── components/ PhysicalDonationForm, DonationLineEditor, ConfirmationStatus
├── services/physicalDonations.api.ts
├── validation/physicalDonation.schema.ts
└── tests/
pages/donor/DeclareGoodsPage.tsx
```

Responsibilities: donor intent declaration, clerk-recorded actual goods/cash, independent donor Yes/No confirmation, rejection/correction status, and a clear rule that only confirmed entries enter inventory or cash reconciliation.

## 12. Student Record, Application, and Vetting

```text
features/assistanceApplications/
features/studentVetting/
pages/student/
├── StudentDashboardPage.tsx
├── UniversityRecordPage.tsx
├── AssistanceApplicationPage.tsx
├── VettingResultPage.tsx
├── ApplicationTimelinePage.tsx
└── StudentAppealsPage.tsx
```

Responsibilities: read-only simulated university record, tuition/upkeep application, no document upload in the prototype, clear Need Index factors and explanations, record-discrepancy reporting, application status timeline, decisions, and appeal intake.

## 13. Student Goods Allowance and Collection

```text
features/goodsCollection/
├── components/ AllowanceSummary, GoodsSelector, CollectionConfirmation
├── services/goodsCollection.api.ts
├── validation/goodsCollection.schema.ts
└── tests/
pages/student/StudentGoodsPage.tsx
pages/student/GoodsRequestPage.tsx
pages/student/CollectionHistoryPage.tsx
```

Responsibilities: show eligible categories, remaining limits, collection history, stock availability, reservation expiry, and the student’s independent confirmation before goods are released.

## 14. Clerk and Inventory Operations

```text
features/inventory/
├── components/ InventoryTable, BatchInspector, StockMovementForm, StockVarianceAlert
├── services/inventory.api.ts
└── tests/
pages/clerk/
```

Responsibilities: incoming physical donation entry, pending donor confirmations, inspection, cash-deposit status, accepted stock, batches, expiry, adjustments with reasons, collection processing, rejected transactions, daily reconciliation, and no clerk override of donor/student confirmations or collection limits.

## 15. Committee Review and Approvals

```text
features/committeeApprovals/
├── components/ ApprovalPanel, ApprovalProgress, ConflictDeclaration, DecisionForm
├── services/approvals.api.ts
└── tests/
pages/committee/
```

Responsibilities: pseudonymized application queue, vetting evidence, conflict declaration, approve/decline/request-review actions, distinct two-of-three approval progress, invalidated approval states, commitments, and approval history.

## 16. Finance, Payouts, and Reconciliation

```text
features/disbursements/
├── components/ PayoutStatus, PayoutTimeline, ReconciliationEvidence
├── services/disbursements.api.ts
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
├── AdminDashboardPage.tsx
├── UsersAndRolesPage.tsx
├── PolicyConfigurationPage.tsx
├── MockUniversityDataPage.tsx
├── InventoryConfigurationPage.tsx
├── IntegrationHealthPage.tsx
└── SecurityIncidentsPage.tsx
```

Responsibilities: staff access, roles, policy configuration, simulated university data, inventory configuration, integration health, security incidents, session revocation, and operational pause controls; administrators cannot approve or release funds alone.

## 19. Complaints, Notifications, and Shared Account Pages

```text
features/complaints/
features/notifications/
pages/errors/
```

Responsibilities: complaints and appeals, restricted case status, notification preferences/listing, account/profile/security pages, forbidden/not-found/unavailable/unexpected-error states, pending transaction guidance, and confirmation-expired recovery.

## 20. Unified Malkia DApp & `Web3.js` Features (`.tsx`)

Coexisting seamlessly under the unified router (`src/app/routeConfig.ts`):
* `features/trace/` (`TracePage.tsx`, `SankeyFlow.tsx`): Public receipt lookup (`MLK-XXXX-XXXX`), allocation Sankey flow, and direct browser `Web3.js` verification against `DonationLedger.sol`.
* `features/signing/` (`SigningQueuePage.tsx`, `signing.test.tsx`): Live `Web3.js` + MetaMask `eth_signTypedData_v4` 2-of-3 EIP-712 signatory signing (`"CharityChain CaseWorkflow"` v1) with Demo Signatory fallback.
* `features/cases/`, `features/donations/`, `features/inventory/` (`PharmacyItemPage.tsx`), `features/graph/` (`FundFlowGraphPage.tsx`), `features/alerts/` (`AlertsPage.tsx`), `features/reports/` (`ReportsPage.tsx`), `features/donor/` (`ClaimPreferencesPage.tsx`, `DonorPortalPage.tsx`), `features/recognition/` (`RecognitionWallPage.tsx`), and `app/layouts/AppLayout.tsx` (`/app/*`).

## 21. Frontend Testing and Verification

```text
src/**/*.test.{ts,tsx}
```

Verification covers route protection, portal navigation, dual theme parity, API error states, form validation, privacy masking, public-data safety, `Web3.js` EIP-712 signing queue (`signing.test.tsx`), `tsc --noEmit`, `eslint --max-warnings=0`, and Vite production builds (52 passing tests across 22 test files).

## Implementation Order

1. Sections 1–7: foundation, auth, authorization, layouts, dual theme, and shared components.
2. Sections 8–11: public pages, `/trace` Sankey verifier, `/claim` & `/wall`, and donor money/goods flows.
3. Sections 12–14: student, vetting, goods, clerk, inventory, and `/inventory/pharmacy` workflows.
4. Sections 15–18: committee, `Web3.js` 2-of-3 signing, finance, 5-col DAG / forensic rules, and admin portals.
5. Sections 19–21: shared recovery/notifications and full frontend verification.
