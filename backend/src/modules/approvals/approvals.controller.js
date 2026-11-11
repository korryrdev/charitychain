'use strict';

import { approvalsService } from './approvals.service.js';
export function createApprovalsController(service = approvalsService) { const handle = (operation) => async (req,res,next) => { try { await operation(req,res); } catch (error) { next(error); } }; return { open: handle(async (req,res) => res.status(201).json({ round: await service.open(req.auth, req.params.applicationId, req.body) })), decide: handle(async (req,res) => res.status(201).json({ round: await service.decide(req.auth, req.params.roundId, req.body) })), get: handle(async (req,res) => res.json({ round: await service.get(req.auth, req.params.roundId) })), list: handle(async (req,res) => { const rounds = await service.list(req.auth, req.params.applicationId); res.json({ rounds, items: rounds }); }) }; }
export const approvalsController = createApprovalsController();
