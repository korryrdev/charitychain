import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { AppLayout } from '@/app/layouts/AppLayout';
import { TracePage } from '@/features/trace/TracePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { CasesPage } from '@/features/cases/CasesPage';
import { NewCasePage } from '@/features/cases/NewCasePage';
import { SigningQueuePage } from '@/features/signing/SigningQueuePage';
import { DonationsPage } from '@/features/donations/DonationsPage';
import { PharmacyItemPage } from '@/features/inventory/PharmacyItemPage';
import { AlertsPage } from '@/features/alerts/AlertsPage';

export const router = createBrowserRouter([
  // Public Portal
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="/trace" replace /> },
      { path: 'trace', element: <TracePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },

  // Authenticated Governance / Internal Portal
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/app/cases" replace /> },
      { path: 'cases', element: <CasesPage /> },
      { path: 'cases/new', element: <NewCasePage /> },
      { path: 'signing', element: <SigningQueuePage /> },
      { path: 'donations', element: <DonationsPage /> },
      { path: 'pharmacy', element: <PharmacyItemPage /> },
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

