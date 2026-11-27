import { Router } from 'express';
import { mpesaCallbacksRouter } from '../integrations/mpesa/mpesa.routes.js';
import { createAuthenticate } from '../middleware/authenticate.js';
import { administrationRouter } from '../modules/administration/administration.routes.js';
import { alertsRouter } from '../modules/alerts/alerts.routes.js';
import { applicationsRouter } from '../modules/applications/applications.routes.js';
import { approvalsRouter } from '../modules/approvals/approvals.routes.js';
import { auditLogsRouter } from '../modules/auditLogs/auditLogs.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { authService } from '../modules/auth/auth.service.js';
import { bankRouter } from '../modules/bank/bank.routes.js';
import { blockchainAuditRouter } from '../modules/blockchainAudit/blockchainAudit.routes.js';
import { casesRouter } from '../modules/cases/cases.routes.js';
import { committeeRouter } from '../modules/committee/committee.routes.js';
import { complaintsRouter } from '../modules/complaints/complaints.routes.js';
import {
  confirmationsRouter,
  publicConfirmationsRouter
} from '../modules/confirmations/confirmations.routes.js';
import { cryptoRouter } from '../modules/crypto/crypto.routes.js';
import { darajaRouter } from '../modules/daraja/daraja.routes.js';
import {
  disbursementsRouter,
  disbursementsWebhookRouter
} from '../modules/disbursements/disbursements.routes.js';
import { donorPortalRouter } from '../modules/donors/donorPortal.routes.js';
import { donorsRouter } from '../modules/donors/donors.routes.js';
import { evidenceRouter } from '../modules/evidence/evidence.routes.js';
import { forensicAnalyticsRouter } from '../modules/forensicAnalytics/forensicAnalytics.routes.js';
import {
  goodsCollectionsRouter,
  publicGoodsCollectionsRouter
} from '../modules/goodsCollections/goodsCollections.routes.js';
import { inventoryRouter } from '../modules/inventory/inventory.routes.js';
import { itemsRouter } from '../modules/items/items.routes.js';
import {
  moneyDonationsRouter,
  publicMoneyDonationsRouter
} from '../modules/moneyDonations/moneyDonations.routes.js';
import { notificationsRouter } from '../modules/notifications/notifications.routes.js';
import { paymentsRouter, paymentsWebhookRouter } from '../modules/payments/payments.routes.js';
import { physicalDonationsRouter } from '../modules/physicalDonations/physicalDonations.routes.js';
import { publicEndpointsRouter } from '../modules/public/public.routes.js';
import {
  publicProfilesManagementRouter,
  publicProfilesRouter
} from '../modules/publicProfiles/publicProfiles.routes.js';
import {
  publicRecognitionRouter,
  recognitionRouter
} from '../modules/recognition/recognition.routes.js';
import { reconciliationRouter } from '../modules/reconciliation/reconciliation.routes.js';
import { reportsRouter } from '../modules/reports/reports.routes.js';
import { rolesRouter } from '../modules/roles/roles.routes.js';
import { sessionsRouter } from '../modules/sessions/sessions.routes.js';
import { studentsRouter } from '../modules/students/students.routes.js';
import { transparencyRouter } from '../modules/transparency/transparency.routes.js';
import { universityRecordsRouter } from '../modules/universityRecords/universityRecords.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { vettingRouter } from '../modules/vetting/vetting.routes.js';
import { createAuthenticatedRouter } from './authenticated.routes.js';
import { healthRouter } from './health.routes.js';
import { createPublicRouter } from './public.routes.js';
import { createWebhookRouter } from './webhook.routes.js';

const defaultPublicRoutes = Object.freeze([
  { path: '/auth', router: authRouter },
  { path: '/donors', router: publicProfilesRouter },
  { path: '/donations', router: publicMoneyDonationsRouter },
  { path: '/recognition', router: publicRecognitionRouter },
  { path: '/confirmations', router: publicConfirmationsRouter },
  { path: '/goods-collections', router: publicGoodsCollectionsRouter },
  { path: '/transparency', router: transparencyRouter },
  { path: '/reports', router: reportsRouter },
  { path: '/crypto', router: cryptoRouter },
  { path: '/', router: publicEndpointsRouter }
]);

const defaultAuthenticatedRoutes = Object.freeze([
  { path: '/users', router: usersRouter },
  { path: '/roles', router: rolesRouter },
  { path: '/sessions', router: sessionsRouter },
  { path: '/cases', router: casesRouter },
  { path: '/donations/bank', router: bankRouter },
  { path: '/donations/items', router: itemsRouter },
  { path: '/inventory/issue', router: itemsRouter },
  { path: '/reports', router: reportsRouter },
  { path: '/alerts', router: alertsRouter },
  { path: '/donor', router: donorPortalRouter },
  { path: '/audit', router: auditLogsRouter },
  { path: '/donors', router: donorsRouter },
  { path: '/donations', router: moneyDonationsRouter },
  { path: '/payments', router: paymentsRouter },
  { path: '/physical-donations', router: physicalDonationsRouter },
  { path: '/confirmations', router: confirmationsRouter },
  { path: '/inventory', router: inventoryRouter },
  { path: '/students', router: studentsRouter },
  { path: '/university-records', router: universityRecordsRouter },
  { path: '/applications', router: applicationsRouter },
  { path: '/vetting', router: vettingRouter },
  { path: '/committee', router: committeeRouter },
  { path: '/approvals', router: approvalsRouter },
  { path: '/disbursements', router: disbursementsRouter },
  { path: '/goods-collections', router: goodsCollectionsRouter },
  { path: '/reconciliation', router: reconciliationRouter },
  { path: '/evidence', router: evidenceRouter },
  { path: '/blockchain-audit', router: blockchainAuditRouter },
  { path: '/audit-logs', router: auditLogsRouter },
  { path: '/forensics', router: forensicAnalyticsRouter },
  { path: '/public-profile', router: publicProfilesManagementRouter },
  { path: '/recognition', router: recognitionRouter },
  { path: '/notifications', router: notificationsRouter },
  { path: '/complaints', router: complaintsRouter },
  { path: '/administration', router: administrationRouter }
]);

const defaultAuthentication = createAuthenticate({ resolveSession: authService.resolveSession });

export function createApiRouter({
  health = healthRouter,
  publicRoutes = defaultPublicRoutes,
  authenticatedRoutes = defaultAuthenticatedRoutes,
  webhookRoutes = [
    { path: '/payments', router: paymentsWebhookRouter },
    { path: '/payments/mpesa', router: mpesaCallbacksRouter },
    { path: '/disbursements', router: disbursementsWebhookRouter }
  ],
  authenticationMiddleware = defaultAuthentication,
  auditMiddleware
} = {}) {
  const router = Router();
  router.use('/health', health);
  router.use('/daraja', darajaRouter);
  router.use('/public', createPublicRouter({ routes: publicRoutes }));
  router.use('/webhooks', createWebhookRouter({ routes: webhookRoutes }));
  router.use(
    createAuthenticatedRouter({
      routes: authenticatedRoutes,
      authenticationMiddleware,
      auditMiddleware
    })
  );
  return router;
}

export const apiRouter = createApiRouter();
