import { z } from 'zod';

export const donorIdParamsSchema = z.object({ donorId: z.uuid() });
export const aliasSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u)
});
export const aliasDecisionSchema = z.object({
  approved: z.boolean(),
  reason: z.string().trim().min(3).max(250).optional()
});
