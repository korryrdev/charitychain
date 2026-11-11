import { createElement } from 'react';
import { FoundationStatus, FrontendHealth } from '../App.jsx';
import { PublicLayout } from '../layouts/PublicLayout.jsx';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { RegisterPage } from '../pages/auth/RegisterPage.jsx';
import { VerifyAccountPage } from '../pages/auth/VerifyAccountPage.jsx';
import { PasswordRecoveryPage } from '../pages/auth/PasswordRecoveryPage.jsx';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage.jsx';
import { MfaChallengePage } from '../pages/auth/MfaChallengePage.jsx';
import { AccessDeniedPage } from '../pages/auth/AccessDeniedPage.jsx';
import { HowItWorksPage } from '../pages/public/HowItWorksPage.jsx';
import { HomePage } from '../pages/public/HomePage.jsx';
import { TransparencyPage } from '../pages/public/TransparencyPage.jsx';
import { DonorRecognitionPage } from '../pages/public/DonorRecognitionPage.jsx';
import { TrackDonationPage } from '../pages/public/TrackDonationPage.jsx';
import { GoodsCataloguePage } from '../pages/public/GoodsCataloguePage.jsx';
import { GovernancePage } from '../pages/public/GovernancePage.jsx';
import { PoliciesPage } from '../pages/public/PoliciesPage.jsx';
import { PrivacyPage } from '../pages/public/PrivacyPage.jsx';
import { ContactPage } from '../pages/public/ContactPage.jsx';
import { ComplaintPage } from '../pages/public/ComplaintPage.jsx';
import { FraudReportPage } from '../pages/public/FraudReportPage.jsx';
import { PhysicalDonationConfirmationPage } from '../pages/public/PhysicalDonationConfirmationPage.jsx';
import { GoodsCollectionConfirmationPage } from '../pages/public/GoodsCollectionConfirmationPage.jsx';
import { CommunityLayout } from '../layouts/CommunityLayout.jsx';
import { ProtectedRoute } from '../features/authorization/components/ProtectedRoute.jsx';
import { DonorDashboardPage } from '../pages/donor/DonorDashboardPage.jsx';
import { DeclareGoodsPage } from '../pages/donor/DeclareGoodsPage.jsx';
import { DonateMoneyPage } from '../pages/donor/DonateMoneyPage.jsx';
import { DonationHistoryPage } from '../pages/donor/DonationHistoryPage.jsx';
import { DonationDetailPage } from '../pages/donor/DonationDetailPage.jsx';
import { ReceiptsPage } from '../pages/donor/ReceiptsPage.jsx';
import { PublicIdentityPage } from '../pages/donor/PublicIdentityPage.jsx';
import { DonorNotificationsPage } from '../pages/donor/DonorNotificationsPage.jsx';
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage.jsx';
import { UniversityRecordPage } from '../pages/student/UniversityRecordPage.jsx';
import { AssistanceApplicationPage } from '../pages/student/AssistanceApplicationPage.jsx';
import { ApplicationTimelinePage } from '../pages/student/ApplicationTimelinePage.jsx';
import { VettingResultPage } from '../pages/student/VettingResultPage.jsx';
import { StudentAppealsPage } from '../pages/student/StudentAppealsPage.jsx';
import { StudentGoodsPage } from '../pages/student/StudentGoodsPage.jsx';
import { GoodsRequestPage } from '../pages/student/GoodsRequestPage.jsx';
import { CollectionHistoryPage } from '../pages/student/CollectionHistoryPage.jsx';
import { ClerkDashboardPage } from '../pages/clerk/ClerkDashboardPage.jsx';
import { ReceiveDonationPage } from '../pages/clerk/ReceiveDonationPage.jsx';
import { PendingConfirmationsPage } from '../pages/clerk/PendingConfirmationsPage.jsx';
import { InspectGoodsPage } from '../pages/clerk/InspectGoodsPage.jsx';
import { InventoryPage } from '../pages/clerk/InventoryPage.jsx';
import { StudentCollectionPage } from '../pages/clerk/StudentCollectionPage.jsx';
import { DailyReconciliationPage } from '../pages/clerk/DailyReconciliationPage.jsx';
import { RejectedTransactionsPage } from '../pages/clerk/RejectedTransactionsPage.jsx';
import { CommitteeDashboardPage } from '../pages/committee/CommitteeDashboardPage.jsx';
import { ReviewQueuePage } from '../pages/committee/ReviewQueuePage.jsx';
import { ApplicationReviewPage } from '../pages/committee/ApplicationReviewPage.jsx';
import { ApprovalHistoryPage } from '../pages/committee/ApprovalHistoryPage.jsx';
import { FundingCommitmentsPage } from '../pages/committee/FundingCommitmentsPage.jsx';
import { FinanceDashboardPage } from '../pages/finance/FinanceDashboardPage.jsx';
import { ApprovedDisbursementsPage } from '../pages/finance/ApprovedDisbursementsPage.jsx';
import { PayoutDetailPage } from '../pages/finance/PayoutDetailPage.jsx';
import { PaymentExceptionsPage } from '../pages/finance/PaymentExceptionsPage.jsx';
import { ReconciliationPage } from '../pages/finance/ReconciliationPage.jsx';
import { AuditorDashboardPage } from '../pages/auditor/AuditorDashboardPage.jsx';
import { AnomalyCasesPage } from '../pages/auditor/AnomalyCasesPage.jsx';
import { InvestigationPage } from '../pages/auditor/InvestigationPage.jsx';
import { MoneyAuditPage } from '../pages/auditor/MoneyAuditPage.jsx';
import { GoodsAuditPage } from '../pages/auditor/GoodsAuditPage.jsx';
import { BlockchainAuditPage } from '../pages/auditor/BlockchainAuditPage.jsx';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.jsx';
import { UsersAndRolesPage } from '../pages/admin/UsersAndRolesPage.jsx';
import { PolicyConfigurationPage } from '../pages/admin/PolicyConfigurationPage.jsx';
import { MockUniversityDataPage } from '../pages/admin/MockUniversityDataPage.jsx';
import { InventoryConfigurationPage } from '../pages/admin/InventoryConfigurationPage.jsx';
import { IntegrationHealthPage } from '../pages/admin/IntegrationHealthPage.jsx';
import { SecurityIncidentsPage } from '../pages/admin/SecurityIncidentsPage.jsx';
export const routeConfig = Object.freeze([
  { path: '/', element: createElement(PublicLayout), children: [
    { index: true, element: createElement(HomePage) }, { path: 'health', element: createElement(FrontendHealth) }, { path: 'how-it-works', element: createElement(HowItWorksPage) }, { path: 'transparency', element: createElement(TransparencyPage) },
    { path: 'recognition', element: createElement(DonorRecognitionPage) }, { path: 'track', element: createElement(TrackDonationPage) }, { path: 'goods', element: createElement(GoodsCataloguePage) }, { path: 'governance', element: createElement(GovernancePage) },
    { path: 'policies', element: createElement(PoliciesPage) }, { path: 'privacy', element: createElement(PrivacyPage) }, { path: 'contact', element: createElement(ContactPage) }, { path: 'complaints', element: createElement(ComplaintPage) }, { path: 'report-fraud', element: createElement(FraudReportPage) }, { path: 'confirm-physical-donation', element: createElement(PhysicalDonationConfirmationPage) }, { path: 'confirm-goods', element: createElement(GoodsCollectionConfirmationPage) },
  ] },
  { path: '/', element: createElement(AuthLayout), children: [
    { path: 'auth/login', element: createElement(LoginPage) }, { path: 'auth/register', element: createElement(RegisterPage) }, { path: 'auth/verify-account', element: createElement(VerifyAccountPage) },
    { path: 'auth/password-recovery', element: createElement(PasswordRecoveryPage) }, { path: 'auth/reset-password', element: createElement(ResetPasswordPage) }, { path: 'auth/mfa', element: createElement(MfaChallengePage) }, { path: 'access-denied', element: createElement(AccessDeniedPage) },
  ] },
  { path: '/donor', element: createElement(ProtectedRoute, { roles: ['DONOR'] }, createElement(CommunityLayout)), children: [
    { index: true, element: createElement(DonorDashboardPage) }, { path: 'donate', element: createElement(DonateMoneyPage) }, { path: 'goods', element: createElement(DeclareGoodsPage) }, { path: 'donations', element: createElement(DonationHistoryPage) },
    { path: 'donations/:donationId', element: createElement(DonationDetailPage) }, { path: 'receipts', element: createElement(ReceiptsPage) }, { path: 'identity', element: createElement(PublicIdentityPage) }, { path: 'notifications', element: createElement(DonorNotificationsPage) },
  ] },
  { path: '/student', element: createElement(ProtectedRoute, { roles: ['STUDENT'] }, createElement(CommunityLayout)), children: [
    { index: true, element: createElement(StudentDashboardPage) }, { path: 'record', element: createElement(UniversityRecordPage) }, { path: 'apply', element: createElement(AssistanceApplicationPage) }, { path: 'applications', element: createElement(ApplicationTimelinePage) }, { path: 'applications/:applicationId', element: createElement(ApplicationTimelinePage) }, { path: 'applications/:applicationId/vetting', element: createElement(VettingResultPage) }, { path: 'appeals', element: createElement(StudentAppealsPage) }, { path: 'goods', element: createElement(StudentGoodsPage) }, { path: 'goods/request', element: createElement(GoodsRequestPage) }, { path: 'goods/history', element: createElement(CollectionHistoryPage) },
  ] },
  { path: '/clerk', element: createElement(ProtectedRoute, { roles: ['CLERK'] }, createElement(CommunityLayout)), children: [
    { index: true, element: createElement(ClerkDashboardPage) }, { path: 'receive', element: createElement(ReceiveDonationPage) }, { path: 'confirmations', element: createElement(PendingConfirmationsPage) }, { path: 'inspect/:donationId', element: createElement(InspectGoodsPage) }, { path: 'inventory', element: createElement(InventoryPage) }, { path: 'collections', element: createElement(StudentCollectionPage) }, { path: 'reconciliation', element: createElement(DailyReconciliationPage) }, { path: 'rejected', element: createElement(RejectedTransactionsPage) },
  ] },
  { path: '/committee', element: createElement(ProtectedRoute, { roles: ['COMMITTEE_MEMBER'] }, createElement(CommunityLayout)), children: [
    { index: true, element: createElement(CommitteeDashboardPage) }, { path: 'review', element: createElement(ReviewQueuePage) }, { path: 'review/:applicationId', element: createElement(ApplicationReviewPage) }, { path: 'history', element: createElement(ApprovalHistoryPage) }, { path: 'commitments', element: createElement(FundingCommitmentsPage) },
  ] },
  { path: '/finance', element: createElement(ProtectedRoute, { roles: ['FINANCE_OFFICER'] }, createElement(CommunityLayout)), children: [
    { index: true, element: createElement(FinanceDashboardPage) }, { path: 'disbursements', element: createElement(ApprovedDisbursementsPage) }, { path: 'disbursements/:disbursementId', element: createElement(PayoutDetailPage) }, { path: 'exceptions', element: createElement(PaymentExceptionsPage) }, { path: 'reconciliation', element: createElement(ReconciliationPage) },
  ] },
  { path: '/auditor', element: createElement(ProtectedRoute, { roles: ['AUDITOR'] }, createElement(CommunityLayout)), children: [
    { index: true, element: createElement(AuditorDashboardPage) }, { path: 'anomalies', element: createElement(AnomalyCasesPage) }, { path: 'anomalies/:anomalyId', element: createElement(InvestigationPage) }, { path: 'money', element: createElement(MoneyAuditPage) }, { path: 'goods', element: createElement(GoodsAuditPage) }, { path: 'blockchain', element: createElement(BlockchainAuditPage) },
  ] },
  { path: '/admin', element: createElement(ProtectedRoute, { roles: ['ADMIN'] }, createElement(CommunityLayout)), children: [
    { index: true, element: createElement(AdminDashboardPage) }, { path: 'users', element: createElement(UsersAndRolesPage) }, { path: 'policies', element: createElement(PolicyConfigurationPage) }, { path: 'university', element: createElement(MockUniversityDataPage) }, { path: 'inventory', element: createElement(InventoryConfigurationPage) }, { path: 'integrations', element: createElement(IntegrationHealthPage) }, { path: 'security', element: createElement(SecurityIncidentsPage) },
  ] },
]);
