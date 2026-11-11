import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { requireMfa } from '../../middleware/requireMfa.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { rolesController } from './roles.controller.js';
import {
  roleAssignmentParamsSchema,
  roleCodeParamsSchema,
  updateRolePermissionsSchema
} from './roles.validation.js';

export function createRolesRouter(controller = rolesController) {
  const router = Router();
  router.use(authorize(PERMISSIONS.ROLE_MANAGE), requireMfa);
  router.get('/', controller.list);
  router.put(
    '/users/:userId/:roleCode',
    validateRequest({ params: roleAssignmentParamsSchema }),
    controller.assign
  );
  router.delete(
    '/users/:userId/:roleCode',
    validateRequest({ params: roleAssignmentParamsSchema }),
    controller.remove
  );
  router.put(
    '/:roleCode/permissions',
    validateRequest({ params: roleCodeParamsSchema, body: updateRolePermissionsSchema }),
    controller.setPermissions
  );
  return router;
}

export const rolesRouter = createRolesRouter();
