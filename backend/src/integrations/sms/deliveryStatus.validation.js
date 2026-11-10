import { z } from 'zod';
export const deliveryStatusSchema = z.object({ providerMessageId: z.string().min(1).max(200), status: z.enum(['SENT','DELIVERED','FAILED']), failureReason: z.string().max(500).optional() }).strict();
