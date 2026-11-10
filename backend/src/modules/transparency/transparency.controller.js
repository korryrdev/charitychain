'use strict';

import { transparencyService } from './transparency.service.js';
export function createTransparencyController(service = transparencyService) { return { dashboard: async (_req, res, next) => { try { res.json({ dashboard: await service.dashboard() }); } catch (error) { next(error); } } }; }
export const transparencyController = createTransparencyController();
