'use strict';

import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { blockchainAuditController } from './blockchainAudit.controller.js';
import { anchorParamsSchema, queueAnchorSchema } from './blockchainAudit.validation.js';

export function createBlockchainAuditRouter(controller = blockchainAuditController) {
  const router = Router();
  router.post('/anchors', validateRequest({ body: queueAnchorSchema }), controller.queue);
  router.get('/anchors/:anchorId', validateRequest({ params: anchorParamsSchema }), controller.get);
  router.post('/anchors/:anchorId/submit', validateRequest({ params: anchorParamsSchema }), controller.submit);
  router.post('/anchors/:anchorId/monitor', validateRequest({ params: anchorParamsSchema }), controller.monitor);
  return router;
}

export const blockchainAuditRouter = createBlockchainAuditRouter();
