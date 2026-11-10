'use strict';

import { Router } from 'express';
import { transparencyController } from './transparency.controller.js';
export function createTransparencyRouter(controller = transparencyController) { const router = Router(); router.get('/dashboard', controller.dashboard); return router; }
export const transparencyRouter = createTransparencyRouter();
