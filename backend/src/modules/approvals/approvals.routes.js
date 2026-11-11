'use strict';

import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { approvalsController } from './approvals.controller.js';
import { approvalApplicationParamsSchema, approvalRoundParamsSchema, decisionSchema, openApprovalSchema } from './approvals.validation.js';
export function createApprovalsRouter(controller = approvalsController) { const router = Router(); router.post('/applications/:applicationId/rounds', validateRequest({ params: approvalApplicationParamsSchema, body: openApprovalSchema }), controller.open); router.get('/applications/:applicationId/rounds', validateRequest({ params: approvalApplicationParamsSchema }), controller.list); router.get('/rounds/:roundId', validateRequest({ params: approvalRoundParamsSchema }), controller.get); router.post('/rounds/:roundId/decisions', validateRequest({ params: approvalRoundParamsSchema, body: decisionSchema }), controller.decide); return router; }
export const approvalsRouter = createApprovalsRouter();
