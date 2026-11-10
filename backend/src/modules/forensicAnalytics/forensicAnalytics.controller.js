'use strict';

import { forensicAnalyticsService } from './forensicAnalytics.service.js';
export function createForensicAnalyticsController(service = forensicAnalyticsService) { const handle = (operation) => async (req, res, next) => { try { await operation(req, res); } catch (error) { next(error); } }; return { scan: handle(async (req, res) => res.json(await service.scan(req.auth))), list: handle(async (req, res) => res.json(await service.list(req.auth, req.query))), get: handle(async (req, res) => res.json({ anomaly: await service.get(req.auth, req.params.anomalyId) })), open: handle(async (req, res) => res.json({ anomaly: await service.openInvestigation(req.auth, req.params.anomalyId) })), update: handle(async (req, res) => res.json({ anomaly: await service.updateInvestigation(req.auth, req.params.anomalyId, req.body) })) }; }
export const forensicAnalyticsController = createForensicAnalyticsController();
