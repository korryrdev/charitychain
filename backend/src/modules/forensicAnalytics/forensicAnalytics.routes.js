'use strict';

import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { forensicAnalyticsController } from './forensicAnalytics.controller.js';
import { anomalyParamsSchema, investigationUpdateSchema } from './forensicAnalytics.validation.js';
export function createForensicAnalyticsRouter(controller = forensicAnalyticsController) { const router = Router(); router.post('/scan', controller.scan); router.get('/anomalies', controller.list); router.get('/anomalies/:anomalyId', validateRequest({ params: anomalyParamsSchema }), controller.get); router.post('/anomalies/:anomalyId/investigation', validateRequest({ params: anomalyParamsSchema }), controller.open); router.patch('/anomalies/:anomalyId/investigation', validateRequest({ params: anomalyParamsSchema, body: investigationUpdateSchema }), controller.update); return router; }
export const forensicAnalyticsRouter = createForensicAnalyticsRouter();
