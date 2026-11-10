'use strict';

import { reconciliationService } from './reconciliation.service.js';
export function createReconciliationController(service = reconciliationService) { const handle = (operation) => async (req,res,next) => { try { await operation(req,res); } catch (error) { next(error); } }; return { execute: handle(async (req,res) => res.status(201).json({ reconciliation: await service.execute(req.auth, req.body) })), get: handle(async (req,res) => res.json({ reconciliation: await service.get(req.auth, req.params.runId) })) }; }
export const reconciliationController = createReconciliationController();
