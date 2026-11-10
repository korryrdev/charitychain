'use strict';

import { z } from 'zod';

export const membershipParamsSchema = z.object({ membershipId: z.uuid() }).strict();
export const conflictParamsSchema = z.object({ conflictId: z.uuid() }).strict();
export const applicationConflictParamsSchema = z.object({ applicationId: z.uuid() }).strict();
export const createMembershipSchema = z.object({
  userId: z.uuid(),
  seat: z.enum(['CHAIRPERSON', 'TREASURER', 'SECRETARY']),
  termStartsAt: z.coerce.date(),
  termEndsAt: z.coerce.date(),
  reason: z.string().trim().min(10).max(500)
}).strict().superRefine((value, context) => {
  if (value.termEndsAt <= value.termStartsAt) context.addIssue({ code: 'custom', path: ['termEndsAt'], message: 'Term end must be after term start.' });
  if (value.termEndsAt.getTime() - value.termStartsAt.getTime() > 3 * 366 * 86400000) context.addIssue({ code: 'custom', path: ['termEndsAt'], message: 'A committee term cannot exceed three years.' });
});
export const membershipTransitionSchema = z.object({ version: z.coerce.number().int().positive(), reason: z.string().trim().min(10).max(500) }).strict();
export const declareConflictSchema = z.object({ membershipId: z.uuid(), type: z.enum(['FAMILY_RELATIONSHIP','FINANCIAL_INTEREST','ORGANIZATIONAL_RELATIONSHIP','PERSONAL_RELATIONSHIP','OTHER']), description: z.string().trim().min(15).max(1000) }).strict();
export const resolveConflictSchema = z.object({ status: z.enum(['CONFIRMED','DISMISSED']), resolutionNote: z.string().trim().min(15).max(1000) }).strict();
