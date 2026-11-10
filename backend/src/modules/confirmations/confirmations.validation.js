import { z } from 'zod';
export const physicalConfirmationParamsSchema = z.object({ donationId: z.uuid() }).strict();
export const confirmationIdParamsSchema = z.object({ confirmationId: z.uuid() }).strict();
export const confirmationResponseSchema = z.object({ token: z.string().min(40).max(100), decision: z.enum(['YES','NO']) }).strict();
