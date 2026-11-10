import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { AppLayout } from '@/app/layouts/AppLayout';
import { RequireAuth } from '@/app/guards/RequireAuth';
import { TracePage } from '@/features/trace/TracePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RecognitionWallPage } from '@/features/recognition/RecognitionWallPage';
import { ClaimPreferencesPage } from '@/features/donor/ClaimPreferencesPage';
import { CasesPage } from '@/features/cases/CasesPage';
import { NewCasePage } from '@/features/cases/NewCasePage';
import { SigningQueuePage } from '@/features/signing/SigningQueuePage';
import { DonationsPage } from '@/features/donations/DonationsPage';
import { PharmacyItemPage } from '@/features/inventory/PharmacyItemPage';
import { AlertsPage } from '@/features/alerts/AlertsPage';
import { FundFlowGraphPage } from '@/features/graph/FundFlowGraphPage';

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
      { path: 'donor/claim', element: <ClaimPreferencesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'login', element: <LoginPage /> },
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
