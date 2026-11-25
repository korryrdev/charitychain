import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { administrationController } from './administration.controller.js';
export const administrationRouter = Router();
administrationRouter.use(authorize(PERMISSIONS.SYSTEM_ADMINISTER));
administrationRouter.get('/overview', administrationController.overview);
