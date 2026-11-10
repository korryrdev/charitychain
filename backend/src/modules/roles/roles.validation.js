import { z } from 'zod';
import { PERMISSION_VALUES } from '../../constants/permissions.js';
import { ROLE_VALUES } from '../../constants/roles.js';

export const roleCodeParamsSchema = z.object({ roleCode: z.enum(ROLE_VALUES) });
export const roleAssignmentParamsSchema = roleCodeParamsSchema.extend({ userId: z.uuid() });
export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.enum(PERMISSION_VALUES)).min(1).max(PERMISSION_VALUES.length)
});
