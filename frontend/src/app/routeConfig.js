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
import { CommunityLayout } from '../layouts/CommunityLayout.jsx';
import { ProtectedRoute } from '../features/authorization/components/ProtectedRoute.jsx';
import { DonorDashboardPage } from '../pages/donor/DonorDashboardPage.jsx';
import { DonateMoneyPage } from '../pages/donor/DonateMoneyPage.jsx';
import { DonationHistoryPage } from '../pages/donor/DonationHistoryPage.jsx';
import { DonationDetailPage } from '../pages/donor/DonationDetailPage.jsx';
import { ReceiptsPage } from '../pages/donor/ReceiptsPage.jsx';
import { PublicIdentityPage } from '../pages/donor/PublicIdentityPage.jsx';
import { DonorNotificationsPage } from '../pages/donor/DonorNotificationsPage.jsx';
export const routeConfig = Object.freeze([
  { path: '/', element: createElement(PublicLayout), children: [
    { index: true, element: createElement(HomePage) }, { path: 'health', element: createElement(FrontendHealth) }, { path: 'how-it-works', element: createElement(HowItWorksPage) }, { path: 'transparency', element: createElement(TransparencyPage) },
    { path: 'recognition', element: createElement(DonorRecognitionPage) }, { path: 'track', element: createElement(TrackDonationPage) }, { path: 'goods', element: createElement(GoodsCataloguePage) }, { path: 'governance', element: createElement(GovernancePage) },
    { path: 'policies', element: createElement(PoliciesPage) }, { path: 'privacy', element: createElement(PrivacyPage) }, { path: 'contact', element: createElement(ContactPage) }, { path: 'complaints', element: createElement(ComplaintPage) }, { path: 'report-fraud', element: createElement(FraudReportPage) },
  ] },
  { path: '/', element: createElement(AuthLayout), children: [
    { path: 'auth/login', element: createElement(LoginPage) }, { path: 'auth/register', element: createElement(RegisterPage) }, { path: 'auth/verify-account', element: createElement(VerifyAccountPage) },
    { path: 'auth/password-recovery', element: createElement(PasswordRecoveryPage) }, { path: 'auth/reset-password', element: createElement(ResetPasswordPage) }, { path: 'auth/mfa', element: createElement(MfaChallengePage) }, { path: 'access-denied', element: createElement(AccessDeniedPage) },
  ] },
  { path: '/donor', element: createElement(ProtectedRoute, { roles: ['DONOR'] }, createElement(CommunityLayout)), children: [
    { index: true, element: createElement(DonorDashboardPage) }, { path: 'donate', element: createElement(DonateMoneyPage) }, { path: 'donations', element: createElement(DonationHistoryPage) },
    { path: 'donations/:donationId', element: createElement(DonationDetailPage) }, { path: 'receipts', element: createElement(ReceiptsPage) }, { path: 'identity', element: createElement(PublicIdentityPage) }, { path: 'notifications', element: createElement(DonorNotificationsPage) },
  ] },
]);
