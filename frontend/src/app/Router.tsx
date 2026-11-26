import React from 'react';
import { createBrowserRouter, Navigate, useRoutes, type RouteObject } from 'react-router-dom';
import { routeConfig } from './routeConfig';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { AppLayout } from '@/app/layouts/AppLayout';
import { RequireAuth } from '@/app/guards/RequireAuth';
import { TracePage } from '@/features/trace/TracePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { DonorPortalPage } from '@/features/donor/DonorPortalPage';
import { RecognitionWallPage } from '@/features/recognition/RecognitionWallPage';
import { ClaimPreferencesPage } from '@/features/donor/ClaimPreferencesPage';
import { CasesPage } from '@/features/cases/CasesPage';
import { NewCasePage } from '@/features/cases/NewCasePage';
import { SigningQueuePage } from '@/features/signing/SigningQueuePage';
import { DonationsPage } from '@/features/donations/DonationsPage';
import { PharmacyItemPage } from '@/features/inventory/PharmacyItemPage';
import { AlertsPage } from '@/features/alerts/AlertsPage';
import { FundFlowGraphPage } from '@/features/graph/FundFlowGraphPage';
import { FraudReportPage } from '@/features/public/FraudReportPage';
import { GoodsCataloguePage } from '@/features/public/GoodsCataloguePage';

export const router = createBrowserRouter([
  // Public Portal
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="/trace" replace /> },
      { path: 'trace', element: <TracePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'wall', element: <RecognitionWallPage /> },
      { path: 'donor', element: <RequireAuth><DonorPortalPage /></RequireAuth> },
      { path: 'donor/claim', element: <ClaimPreferencesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'report-fraud', element: <FraudReportPage /> },
      { path: 'goods-catalogue', element: <GoodsCataloguePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },

  // Authenticated Governance / Internal Portal (Protected by RequireAuth)
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/cases" replace /> },
      { path: 'cases', element: <CasesPage /> },
      { path: 'cases/new', element: <NewCasePage /> },
      { path: 'signing', element: <SigningQueuePage /> },
      { path: 'donations', element: <DonationsPage /> },
      { path: 'pharmacy', element: <PharmacyItemPage /> },
      { path: 'graph', element: <FundFlowGraphPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/trace" replace />,
  },
]);

export function AppRouter() {
  return useRoutes([...routeConfig] as RouteObject[]);
}
