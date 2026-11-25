import { administrationService } from './administration.service.js';
export const administrationController = { overview: async (_req,res,next) => { try { res.json({ overview: await administrationService.overview() }); } catch (error) { next(error); } } };
