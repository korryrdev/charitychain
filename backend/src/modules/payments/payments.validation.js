import { z } from 'zod';

const uuid = z.uuid();
export const initiatePaymentSchema = z.object({ donationId: uuid, phoneNumber: z.string().regex(/^254[17]\d{8}$/).optional(), returnUrl: z.url().optional() }).strict();
export const paymentIdParamsSchema = z.object({ paymentId: uuid }).strict();
export const donationPaymentParamsSchema = z.object({ donationId: uuid }).strict();
export const providerWebhookParamsSchema = z.object({ provider: z.enum(['mpesa', 'bank']) }).strict();
export const providerWebhookSchema = z.object({
  eventId: z.string().min(4).max(160), eventType: z.string().min(2).max(80), providerRequestId: z.string().min(2).max(200),
  providerTransactionId: z.string().min(2).max(200).optional(), status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED']),
  amount: z.coerce.number().positive().optional(), currency: z.string().length(3).default('KES'), resultCode: z.string().max(100).optional(),
  resultMessage: z.string().max(500).optional(), occurredAt: z.coerce.date().optional()
}).strict();
