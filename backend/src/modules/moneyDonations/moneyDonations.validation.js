import { z } from 'zod';

export const createMoneyDonationSchema = z.object({
  amount: z.coerce.number().positive().max(10_000_000),
  channel: z.enum(['MPESA_STK', 'MPESA_PAYBILL', 'BANK']),
  purpose: z.enum(['UNRESTRICTED', 'TUITION', 'UPKEEP']).default('UNRESTRICTED'),
  purposeReference: z.string().trim().min(1).max(100).optional()
});
export const donationIdParamsSchema = z.object({ donationId: z.uuid() });
export const donationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['CREATED', 'PAYMENT_REQUESTED', 'PROVIDER_PENDING', 'CONFIRMED', 'RECONCILED', 'FAILED', 'REVERSED']).optional()
});
export const trackingLookupSchema = z.object({
  trackingId: z.string().regex(/^MAL-[A-Z0-9_-]{12}$/),
  verificationSecret: z.string().min(32).max(128)
});
