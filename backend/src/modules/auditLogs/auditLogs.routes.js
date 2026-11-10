'use strict';

import { Router } from 'express';
import { auditLogsController } from './auditLogs.controller.js';

export function createAuditLogsRouter(controller = auditLogsController) {
  const router = Router();
  router.post('/events', controller.record);
  router.get('/events', controller.search);
  router.get('/events/export', controller.export);
  router.get('/integrity', controller.verify);
  return router;
}

export const auditLogsRouter = createAuditLogsRouter();
