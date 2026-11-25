import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { rolesController } from './roles.controller.js';
import {
  roleAssignmentParamsSchema,
  roleCodeParamsSchema,
  createRoleSchema,
  replaceRoleAssignmentsSchema,
  replaceUserPermissionAccessSchema,
  updateRolePermissionsSchema
} from './roles.validation.js';

export function createRolesRouter(controller = rolesController) {
  const router = Router();
  router.use(authorize(PERMISSIONS.ROLE_MANAGE));
  router.get('/', controller.list);
  router.post('/', validateRequest({ body: createRoleSchema }), controller.create);
  router.post('/compose-and-invite', validateRequest({ body: z.object({ role: createRoleSchema, recipient: z.object({ name: z.string().trim().min(2).max(100), email: z.email().trim().toLowerCase() }).strict() }).strict() }), controller.composeAndInvite);
  router.put('/users/:userId', validateRequest({ params: z.object({ userId: z.uuid() }), body: replaceRoleAssignmentsSchema }), controller.replaceAssignments);
  router.put('/users/:userId/permissions', validateRequest({ params: z.object({ userId: z.uuid() }), body: replaceUserPermissionAccessSchema }), controller.replaceUserPermissionAccess);
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
