import { createElement } from 'react';
import { Navigate } from 'react-router-dom';
import { FrontendHealth } from '../App';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { StudentRegisterPage } from '../pages/auth/StudentRegisterPage';
import { StudentLoginPage } from '../pages/auth/StudentLoginPage';
import { VerifyAccountPage } from '../pages/auth/VerifyAccountPage';
import { PasswordRecoveryPage } from '../pages/auth/PasswordRecoveryPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { MfaChallengePage } from '../pages/auth/MfaChallengePage';
import { AccessDeniedPage } from '../pages/auth/AccessDeniedPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';
import { HowItWorksPage } from '../pages/public/HowItWorksPage';
import { HomePage } from '../pages/public/HomePage';
import { TransparencyPage } from '../pages/public/TransparencyPage';
import { DonorRecognitionPage } from '../pages/public/DonorRecognitionPage';
import { TrackDonationPage } from '../pages/public/TrackDonationPage';
import { GoodsCataloguePage } from '../pages/public/GoodsCataloguePage';
import { GovernancePage } from '../pages/public/GovernancePage';
import { PoliciesPage } from '../pages/public/PoliciesPage';
import { PrivacyPage } from '../pages/public/PrivacyPage';
import { ContactPage } from '../pages/public/ContactPage';
import { ComplaintPage } from '../pages/public/ComplaintPage';
import { FraudReportPage } from '../pages/public/FraudReportPage';
import { FaqPage } from '../pages/public/FaqPage';
import { HelpPage } from '../pages/public/HelpPage';
import { PhysicalDonationConfirmationPage } from '../pages/public/PhysicalDonationConfirmationPage';
import { GoodsCollectionConfirmationPage } from '../pages/public/GoodsCollectionConfirmationPage';
import { CommunityLayout } from '../layouts/CommunityLayout';
import { ProtectedRoute } from '../features/authorization/components/ProtectedRoute';
import { DonorDashboardPage } from '../pages/donor/DonorDashboardPage';
import { DeclareGoodsPage } from '../pages/donor/DeclareGoodsPage';
import { DonateMoneyPage } from '../pages/donor/DonateMoneyPage';
import { DonationHistoryPage } from '../pages/donor/DonationHistoryPage';
import { DonationDetailPage } from '../pages/donor/DonationDetailPage';
import { DonorAccountPage } from '../pages/donor/DonorAccountPage';
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';
import { UniversityRecordPage } from '../pages/student/UniversityRecordPage';
import { AssistanceApplicationPage } from '../pages/student/AssistanceApplicationPage';
import { ApplicationTimelinePage } from '../pages/student/ApplicationTimelinePage';
import { VettingResultPage } from '../pages/student/VettingResultPage';
import { StudentAppealsPage } from '../pages/student/StudentAppealsPage';
import { StudentGoodsPage } from '../pages/student/StudentGoodsPage';
import { GoodsRequestPage } from '../pages/student/GoodsRequestPage';
import { CollectionHistoryPage } from '../pages/student/CollectionHistoryPage';
import { StudentAccountPage } from '../pages/student/StudentAccountPage';
import { ClerkDashboardPage } from '../pages/clerk/ClerkDashboardPage';
import { ReceiveDonationPage } from '../pages/clerk/ReceiveDonationPage';
import { PendingConfirmationsPage } from '../pages/clerk/PendingConfirmationsPage';
import { InspectGoodsPage } from '../pages/clerk/InspectGoodsPage';
import { InventoryPage } from '../pages/clerk/InventoryPage';
import { StudentCollectionPage } from '../pages/clerk/StudentCollectionPage';
import { DailyReconciliationPage } from '../pages/clerk/DailyReconciliationPage';
import { RejectedTransactionsPage } from '../pages/clerk/RejectedTransactionsPage';
import { CommitteeDashboardPage } from '../pages/committee/CommitteeDashboardPage';
import { ReviewQueuePage } from '../pages/committee/ReviewQueuePage';
import { ApplicationReviewPage } from '../pages/committee/ApplicationReviewPage';
import { ApprovalHistoryPage } from '../pages/committee/ApprovalHistoryPage';
import { FundingCommitmentsPage } from '../pages/committee/FundingCommitmentsPage';
import { RecognitionModerationPage } from '../pages/committee/RecognitionModerationPage';
import { FinanceDashboardPage } from '../pages/finance/FinanceDashboardPage';
import { ApprovedDisbursementsPage } from '../pages/finance/ApprovedDisbursementsPage';
import { PayoutDetailPage } from '../pages/finance/PayoutDetailPage';
import { PaymentExceptionsPage } from '../pages/finance/PaymentExceptionsPage';
import { ReconciliationPage } from '../pages/finance/ReconciliationPage';
import { AuditorDashboardPage } from '../pages/auditor/AuditorDashboardPage';
import { AnomalyCasesPage } from '../pages/auditor/AnomalyCasesPage';
import { InvestigationPage } from '../pages/auditor/InvestigationPage';
import { MoneyAuditPage } from '../pages/auditor/MoneyAuditPage';
import { GoodsAuditPage } from '../pages/auditor/GoodsAuditPage';
import { BlockchainAuditPage } from '../pages/auditor/BlockchainAuditPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UsersAndRolesPage } from '../pages/admin/UsersAndRolesPage';
import { PolicyConfigurationPage } from '../pages/admin/PolicyConfigurationPage';
import { UniversityRecordsAdminPage } from '../pages/admin/UniversityRecordsAdminPage';
import { DonorIdentityRevealPage } from '../pages/admin/DonorIdentityRevealPage';
import { InventoryConfigurationPage } from '../pages/admin/InventoryConfigurationPage';
import { IntegrationHealthPage } from '../pages/admin/IntegrationHealthPage';
import { SecurityIncidentsPage } from '../pages/admin/SecurityIncidentsPage';
import { InventorySupervisorDashboardPage } from '../pages/inventory/InventorySupervisorDashboardPage';
import { AppLayout as MalkiaAppLayout } from './layouts/AppLayout';
import { TracePage } from '../features/trace/TracePage';
import { DashboardPage as PublicDappDashboardPage } from '../features/dashboard/DashboardPage';
import { RecognitionWallPage } from '../features/recognition/RecognitionWallPage';
import { ClaimPreferencesPage } from '../features/donor/ClaimPreferencesPage';
import { DonorPortalPage } from '../features/donor/DonorPortalPage';
import { ReportsPage as QuarterlyReportsPage } from '../features/reports/ReportsPage';
import { LoginPage as DappLoginPage } from '../features/auth/LoginPage';
import { RegisterPage as DappRegisterPage } from '../features/auth/RegisterPage';
import { CasesPage } from '../features/cases/CasesPage';
import { NewCasePage } from '../features/cases/NewCasePage';
import { SigningQueuePage } from '../features/signing/SigningQueuePage';
import { DonationsPage as BankDepositsPage } from '../features/donations/DonationsPage';
import { PharmacyItemPage } from '../features/inventory/PharmacyItemPage';
import { AlertsPage as ForensicAlertsPage } from '../features/alerts/AlertsPage';
import { FundFlowGraphPage } from '../features/graph/FundFlowGraphPage';

export const routeConfig = Object.freeze([
  {
    path: '/',
    element: createElement(PublicLayout),
    children: [
      { index: true, element: createElement(HomePage) },
      { path: 'health', element: createElement(FrontendHealth) },
      { path: 'how-it-works', element: createElement(HowItWorksPage) },
      { path: 'transparency', element: createElement(TransparencyPage) },
      { path: 'trace', element: createElement(TracePage) },
      { path: 'trace/:receiptCode', element: createElement(TracePage) },
      { path: 'dashboard', element: createElement(PublicDappDashboardPage) },
      { path: 'wall', element: createElement(RecognitionWallPage) },
      { path: 'claim', element: createElement(ClaimPreferencesPage) },
      { path: 'donor/claim', element: createElement(ClaimPreferencesPage) },
      { path: 'reports', element: createElement(QuarterlyReportsPage) },
      { path: 'recognition', element: createElement(DonorRecognitionPage) },
      { path: 'track', element: createElement(TrackDonationPage) },
      { path: 'goods', element: createElement(GoodsCataloguePage) },
      { path: 'governance', element: createElement(GovernancePage) },
      { path: 'policies', element: createElement(PoliciesPage) },
      { path: 'privacy', element: createElement(PrivacyPage) },
      { path: 'faq', element: createElement(FaqPage) },
      { path: 'help', element: createElement(HelpPage) },
      { path: 'contact', element: createElement(ContactPage) },
      { path: 'complaints', element: createElement(ComplaintPage) },
      { path: 'report-fraud', element: createElement(FraudReportPage) },
      { path: 'confirm-physical-donation', element: createElement(PhysicalDonationConfirmationPage) },
      { path: 'confirm-goods', element: createElement(GoodsCollectionConfirmationPage) },
      { path: 'login', element: createElement(DappLoginPage) },
      { path: 'register', element: createElement(DappRegisterPage) },
      { path: '*', element: createElement(NotFoundPage) },
    ],
  },
  {
    path: '/',
    element: createElement(AuthLayout),
    children: [
      { path: 'auth/login', element: createElement(LoginPage) },
      { path: 'auth/register', element: createElement(RegisterPage) },
      { path: 'student/auth/login', element: createElement(StudentLoginPage) },
      { path: 'student/auth/register', element: createElement(StudentRegisterPage) },
      { path: 'auth/verify-account', element: createElement(VerifyAccountPage) },
      { path: 'auth/password-recovery', element: createElement(PasswordRecoveryPage) },
      { path: 'auth/reset-password', element: createElement(ResetPasswordPage) },
      { path: 'auth/mfa', element: createElement(MfaChallengePage) },
      { path: 'access-denied', element: createElement(AccessDeniedPage) },
    ],
  },
  {
    path: '/donor',
    element: createElement(ProtectedRoute, { roles: ['DONOR'] }, createElement(CommunityLayout)),
    children: [
      { index: true, element: createElement(DonorDashboardPage) },
      { path: 'donate', element: createElement(DonateMoneyPage) },
      { path: 'goods', element: createElement(DeclareGoodsPage) },
      { path: 'donations', element: createElement(DonationHistoryPage) },
      { path: 'donations/:donationId', element: createElement(DonationDetailPage) },
      { path: 'dapp', element: createElement(DonorPortalPage) },
      { path: 'receipts', element: createElement(Navigate, { to: '/donor/donations', replace: true }) },
      { path: 'identity', element: createElement(Navigate, { to: '/donor/account?section=identity', replace: true }) },
      { path: 'notifications', element: createElement(Navigate, { to: '/donor', replace: true }) },
      { path: 'account', element: createElement(DonorAccountPage) },
    ],
  },
  {
    path: '/student',
    element: createElement(ProtectedRoute, { roles: ['STUDENT'] }, createElement(CommunityLayout)),
    children: [
      { index: true, element: createElement(StudentDashboardPage) },
      { path: 'record', element: createElement(UniversityRecordPage) },
      { path: 'apply', element: createElement(AssistanceApplicationPage) },
      { path: 'applications', element: createElement(ApplicationTimelinePage) },
      { path: 'applications/:applicationId', element: createElement(ApplicationTimelinePage) },
      { path: 'applications/:applicationId/vetting', element: createElement(VettingResultPage) },
      { path: 'appeals', element: createElement(StudentAppealsPage) },
      { path: 'goods', element: createElement(StudentGoodsPage) },
      { path: 'goods/request', element: createElement(GoodsRequestPage) },
      { path: 'goods/history', element: createElement(CollectionHistoryPage) },
      { path: 'account', element: createElement(StudentAccountPage) },
    ],
  },
  {
    path: '/clerk',
    element: createElement(
      ProtectedRoute,
      {
        permissions: [
          'physical-donation:record',
          'physical-donation:inspect',
          'confirmation:manage',
          'inventory:read',
          'inventory:manage',
          'goods-collection:record',
          'goods-collection:release',
        ],
      },
      createElement(CommunityLayout)
    ),
    children: [
      { index: true, element: createElement(ClerkDashboardPage) },
      { path: 'receive', element: createElement(ReceiveDonationPage) },
      { path: 'confirmations', element: createElement(PendingConfirmationsPage) },
      { path: 'inspect/:donationId', element: createElement(InspectGoodsPage) },
      { path: 'inventory', element: createElement(InventoryPage) },
      { path: 'collections', element: createElement(StudentCollectionPage) },
      { path: 'reconciliation', element: createElement(DailyReconciliationPage) },
      { path: 'rejected', element: createElement(RejectedTransactionsPage) },
    ],
  },
  {
    path: '/committee',
    element: createElement(
      ProtectedRoute,
      {
        permissions: [
          'application:review',
          'application:approve',
          'committee:manage',
          'case:create',
          'case:submit',
          'case:read',
          'case:decide',
          'release:authorize',
          'recognition:moderate',
          'badge-tier:manage',
        ],
      },
      createElement(CommunityLayout)
    ),
    children: [
      { index: true, element: createElement(CommitteeDashboardPage) },
      { path: 'review', element: createElement(ReviewQueuePage) },
      { path: 'review/:applicationId', element: createElement(ApplicationReviewPage) },
      { path: 'cases', element: createElement(CasesPage) },
      { path: 'cases/new', element: createElement(NewCasePage) },
      { path: 'signing', element: createElement(SigningQueuePage) },
      {
        path: 'recognition',
        element: createElement(
          ProtectedRoute,
          { permissions: ['recognition:moderate', 'badge-tier:manage'] },
          createElement(RecognitionModerationPage)
        ),
      },
      { path: 'history', element: createElement(ApprovalHistoryPage) },
      { path: 'commitments', element: createElement(FundingCommitmentsPage) },
    ],
  },
  {
    path: '/finance',
    element: createElement(
      ProtectedRoute,
      {
        permissions: [
          'disbursement:create',
          'disbursement:execute',
          'disbursement:read',
          'reconciliation:execute',
          'reconciliation:read',
        ],
      },
      createElement(CommunityLayout)
    ),
    children: [
      { index: true, element: createElement(FinanceDashboardPage) },
      { path: 'bank-deposits', element: createElement(BankDepositsPage) },
      { path: 'disbursements', element: createElement(ApprovedDisbursementsPage) },
      { path: 'disbursements/:disbursementId', element: createElement(PayoutDetailPage) },
      { path: 'exceptions', element: createElement(PaymentExceptionsPage) },
      { path: 'reconciliation', element: createElement(ReconciliationPage) },
    ],
  },
  {
    path: '/inventory',
    element: createElement(
      ProtectedRoute,
      { permissions: ['inventory:read', 'inventory:manage', 'item-log:create', 'item:issue'] },
      createElement(CommunityLayout)
    ),
    children: [
      { index: true, element: createElement(InventorySupervisorDashboardPage) },
      { path: 'stock', element: createElement(InventoryPage) },
      { path: 'pharmacy', element: createElement(PharmacyItemPage) },
    ],
  },
  {
    path: '/auditor',
    element: createElement(
      ProtectedRoute,
      {
        permissions: [
          'evidence:read',
          'audit:read',
          'forensics:read',
          'forensics:investigate',
          'report:read',
          'report:generate',
          'alert:read',
          'rules:manage',
        ],
      },
      createElement(CommunityLayout)
    ),
    children: [
      { index: true, element: createElement(AuditorDashboardPage) },
      { path: 'anomalies', element: createElement(AnomalyCasesPage) },
      { path: 'anomalies/:anomalyId', element: createElement(InvestigationPage) },
      { path: 'fund-flow-dag', element: createElement(FundFlowGraphPage) },
      { path: 'forensic-rules', element: createElement(ForensicAlertsPage) },
      { path: 'money', element: createElement(MoneyAuditPage) },
      { path: 'goods', element: createElement(GoodsAuditPage) },
      { path: 'blockchain', element: createElement(BlockchainAuditPage) },
      { path: 'quarterly-reports', element: createElement(QuarterlyReportsPage) },
    ],
  },
  {
    path: '/admin',
    element: createElement(
      ProtectedRoute,
      {
        permissions: [
          'system:administer',
          'user:manage',
          'role:manage',
          'policy:manage',
          'donor-identity:reveal',
        ],
      },
      createElement(CommunityLayout)
    ),
    children: [
      { index: true, element: createElement(AdminDashboardPage) },
      { path: 'users', element: createElement(UsersAndRolesPage) },
      { path: 'policies', element: createElement(PolicyConfigurationPage) },
      { path: 'university', element: createElement(UniversityRecordsAdminPage) },
      {
        path: 'donor-identity',
        element: createElement(
          ProtectedRoute,
          { permissions: ['donor-identity:reveal'] },
          createElement(DonorIdentityRevealPage)
        ),
      },
      { path: 'inventory', element: createElement(InventoryConfigurationPage) },
      { path: 'integrations', element: createElement(IntegrationHealthPage) },
      { path: 'security', element: createElement(SecurityIncidentsPage) },
    ],
  },
  {
    path: '/app',
    element: createElement(
      ProtectedRoute,
      {
        permissions: [
          'case:read',
          'case:create',
          'case:decide',
          'release:authorize',
          'bank-deposit:create',
          'bank-deposit:verify',
          'item-log:create',
          'item:issue',
          'alert:read',
          'report:read',
          'forensics:read',
          'system:administer',
        ],
      },
      createElement(MalkiaAppLayout)
    ),
    children: [
      { index: true, element: createElement(Navigate, { to: '/app/cases', replace: true }) },
      { path: 'cases', element: createElement(CasesPage) },
      { path: 'cases/new', element: createElement(NewCasePage) },
      { path: 'signing', element: createElement(SigningQueuePage) },
      { path: 'donations', element: createElement(BankDepositsPage) },
      { path: 'pharmacy', element: createElement(PharmacyItemPage) },
      { path: 'graph', element: createElement(FundFlowGraphPage) },
      { path: 'alerts', element: createElement(ForensicAlertsPage) },
      { path: 'reports', element: createElement(QuarterlyReportsPage) },
    ],
  },
]);
