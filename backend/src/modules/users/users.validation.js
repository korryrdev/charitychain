import { z } from 'zod';
import { STATUSES } from '../../constants/statuses.js';

export const userIdParamsSchema = z.object({ userId: z.uuid() });
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    image: z.url().nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required.');
export const updateUserStatusSchema = z.object({ status: z.enum(Object.values(STATUSES.USER)) });
export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
  roles: z.array(z.string()).default([])
});
export const updateUserRolesSchema = z.object({
  roles: z.array(z.string()).min(1)
});
export const closeOwnAccountSchema = z.object({
  password: z.string().min(12).max(128),
  confirmation: z.literal('DELETE')
});
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(Object.values(STATUSES.USER)).optional(),
  search: z.string().trim().max(100).optional()
});
export const createStaffAccountSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  roles: z.array(z.string().trim().regex(/^[A-Z][A-Z0-9_]{2,40}$/)).min(1).max(20)
});
