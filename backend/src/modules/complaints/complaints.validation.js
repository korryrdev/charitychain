import { z } from 'zod';

export const createAppealSchema = z
  .object({
    applicationId: z.uuid().optional(),
    category: z.enum([
      'VETTING_DECISION',
      'UNIVERSITY_RECORD',
      'APPLICATION_STATUS',
      'GOODS_COLLECTION',
      'OTHER',
    ]),
    message: z.string().trim().min(20).max(2000),
  })
  .strict();

const optionalShortString = (max) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(max).optional()
  );

export const createComplaintSchema = z
  .object({
    category: z.enum([
      'DONATION_ISSUE',
      'VETTING_DECISION',
      'DISBURSEMENT_DELAY',
      'GOODS_HANDOVER',
      'PRIVACY_CONCERN',
      'OTHER',
    ]),
    subject: z.string().trim().min(5).max(140),
    description: z.string().trim().min(15).max(3000),
    reference: optionalShortString(120),
    reporterContact: optionalShortString(160),
  })
  .strict();

export const createFraudReportSchema = z
  .object({
    category: z.enum([
      'RECEIPT_ANOMALY',
      'UNAUTHORIZED_COLLECTION',
      'PAYOUT_DISCREPANCY',
      'IMPERSONATION',
      'OTHER',
    ]),
    reference: optionalShortString(120),
    description: z.string().trim().min(15).max(3000),
    reporterContact: optionalShortString(160),
  })
  .strict();

export const resolveComplaintSchema = z
  .object({
    status: z.enum(['UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
    notes: z.string().trim().min(5).max(2000),
  })
  .strict();

export const complaintIdParamsSchema = z.object({ id: z.uuid() }).strict();
