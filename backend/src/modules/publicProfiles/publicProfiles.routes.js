import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { publicProfilesController } from './publicProfiles.controller.js';
import {
  publicDonorParamsSchema,
  publicProfileSettingsSchema,
  publicProfilesQuerySchema
} from './publicProfiles.validation.js';

export function createPublicProfilesRouter(controller = publicProfilesController) {
  const router = Router();
  router.get('/', validateRequest({ query: publicProfilesQuerySchema }), controller.list);
  router.get('/:donorId', validateRequest({ params: publicDonorParamsSchema }), controller.get);
  return router;
}

export function createPublicProfilesManagementRouter(controller = publicProfilesController) {
  const router = Router();
  router.patch(
    '/me',
    validateRequest({ body: publicProfileSettingsSchema }),
    controller.updateMine
  );
  return router;
}

export const publicProfilesRouter = createPublicProfilesRouter();
export const publicProfilesManagementRouter = createPublicProfilesManagementRouter();
