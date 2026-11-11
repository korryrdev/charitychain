import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { appealsService } from './appeals.service.js';
import { createAppealSchema } from './complaints.validation.js';

export const complaintsRouter = Router();
complaintsRouter.get('/appeals/mine', async (req, res, next) => { try { res.json({ items: await appealsService.mine(req.auth) }); } catch (error) { next(error); } });
complaintsRouter.post('/appeals', validateRequest({ body: createAppealSchema }), async (req, res, next) => { try { res.status(201).json({ appeal: await appealsService.create(req.auth, req.body) }); } catch (error) { next(error); } });
