import { z } from 'zod';

export const createAppealSchema = z.object({
  applicationId: z.uuid().optional(),
  category: z.enum(['VETTING_DECISION', 'UNIVERSITY_RECORD', 'APPLICATION_STATUS', 'GOODS_COLLECTION', 'OTHER']),
  message: z.string().trim().min(20).max(2000)
}).strict();
