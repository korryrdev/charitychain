import { z } from 'zod';

export const publicDonorParamsSchema = z.object({ donorId: z.uuid() });
export const publicProfileSettingsSchema = z
  .object({
    displayNameMode: z.enum(['ALIAS', 'REAL_NAME']).optional(),
    publicListed: z.boolean().optional(),
    showContributionTotal: z.boolean().optional(),
    showRecognitionTier: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one setting is required.');
export const publicProfilesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  tier: z.enum(['UNRANKED', 'SILVER', 'GOLD', 'DIAMOND', 'PLATINUM']).optional()
});
