import { z } from 'zod';
import { PERMISSION_VALUES } from '../../constants/permissions.js';
import { ROLE_VALUES } from '../../constants/roles.js';

const roleCode = z.string().trim().regex(/^[A-Z][A-Z0-9_]{2,40}$/);
export const roleCodeParamsSchema = z.object({ roleCode });
export const roleAssignmentParamsSchema = roleCodeParamsSchema.extend({ userId: z.uuid() });
export const replaceRoleAssignmentsSchema = z.object({ roles: z.array(roleCode).max(20) });
export const replaceUserPermissionAccessSchema = z.object({ permissions: z.array(z.enum(PERMISSION_VALUES)).min(1).max(PERMISSION_VALUES.length) });
export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.enum(PERMISSION_VALUES)).min(1).max(PERMISSION_VALUES.length)
});
export const createRoleSchema = z.object({
  code: roleCode,
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(z.enum(PERMISSION_VALUES)).min(1).max(PERMISSION_VALUES.length)
}).refine((value) => !ROLE_VALUES.includes(value.code), 'Built-in roles cannot be recreated.');
