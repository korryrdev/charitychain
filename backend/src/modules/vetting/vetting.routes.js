import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { vettingController } from './vetting.controller.js';
import { createVettingPolicySchema, vettingApplicationParamsSchema, vettingRunParamsSchema } from './vetting.validation.js';
export function createVettingRouter(controller = vettingController) { const router = Router(); router.get('/policy', controller.activePolicy); router.post('/policy', validateRequest({ body: createVettingPolicySchema }), controller.createPolicy); router.post('/applications/:applicationId', validateRequest({ params: vettingApplicationParamsSchema }), controller.execute); router.get('/runs/:runId', validateRequest({ params: vettingRunParamsSchema }), controller.get); return router; }
export const vettingRouter = createVettingRouter();
