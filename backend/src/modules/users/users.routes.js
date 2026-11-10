import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { requireMfa } from '../../middleware/requireMfa.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { usersController } from './users.controller.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  updateUserRolesSchema,
  updateUserStatusSchema,
  userIdParamsSchema
} from './users.validation.js';

export function createUsersRouter(controller = usersController) {
  const router = Router();
  router.get('/me', controller.me);
  router.get(
    '/',
    authorize(PERMISSIONS.USER_MANAGE),
    validateRequest({ query: listUsersQuerySchema }),
    controller.list
  );
  router.post(
    '/',
    authorize(PERMISSIONS.USER_MANAGE),
    validateRequest({ body: createUserSchema }),
    controller.create
  );
  router.get('/:userId', validateRequest({ params: userIdParamsSchema }), controller.get);
  router.patch(
    '/:userId/profile',
    validateRequest({ params: userIdParamsSchema, body: updateProfileSchema }),
    controller.updateProfile
  );
  router.patch(
    '/:userId/roles',
    authorize(PERMISSIONS.USER_MANAGE),
    validateRequest({ params: userIdParamsSchema, body: updateUserRolesSchema }),
    controller.updateRoles
  );
  router.patch(
    '/:userId/status',
    authorize(PERMISSIONS.USER_MANAGE),
    requireMfa,
    validateRequest({ params: userIdParamsSchema, body: updateUserStatusSchema }),
    controller.updateStatus
  );
  return router;
}

export const usersRouter = createUsersRouter();
