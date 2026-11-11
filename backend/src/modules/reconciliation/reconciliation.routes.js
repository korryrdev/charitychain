'use strict';

import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { reconciliationController } from './reconciliation.controller.js';
import { executeReconciliationSchema, reconciliationRunParamsSchema } from './reconciliation.validation.js';
export function createReconciliationRouter(controller = reconciliationController) { const router = Router(); router.post('/runs', validateRequest({ body: executeReconciliationSchema }), controller.execute); router.get('/runs/:runId', validateRequest({ params: reconciliationRunParamsSchema }), controller.get); return router; }
export const reconciliationRouter = createReconciliationRouter();
