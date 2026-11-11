import { z } from 'zod';

export const vettingApplicationParamsSchema = z.object({ applicationId: z.uuid() }).strict();
export const vettingRunParamsSchema = z.object({ runId: z.uuid() }).strict();

const positive = z.coerce.number().nonnegative();

export const createVettingPolicySchema = z
  .object({
    version: z.string().trim().regex(/^[a-z0-9][a-z0-9._-]{2,40}$/i),
    name: z.string().trim().min(3).max(100),
    configuration: z
      .object({
        weights: z
          .object({
            microPayment: positive,
            examPeriodPayment: positive,
            financeBlock: positive,
            aidReliance: positive,
            unmetBalance: positive,
          })
          .strict(),
        penalties: z
          .object({
            previousAssistancePerRecord: positive,
            maximumPreviousAssistance: positive,
          })
          .strict(),
        thresholds: z
          .object({
            verifiedScore: z.coerce.number().min(0).max(100),
            manualReviewScore: z.coerce.number().min(0).max(100),
            microPaymentMaximum: z.coerce.number().positive(),
            minimumMicroPayments: z.coerce.number().int().positive(),
            examPaymentWindowDays: z.coerce.number().int().positive(),
            examPaymentOccurrencesForFullScore: z.coerce.number().int().positive(),
            financeBlocksForFullScore: z.coerce.number().int().positive(),
            balanceRatioForFullScore: z.coerce.number().positive().max(1),
            previousAssistanceLookbackRecords: z.coerce.number().int().nonnegative(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    const total = Object.values(value.configuration.weights).reduce((sum, weight) => sum + weight, 0);
    if (total !== 100) {
      context.addIssue({
        code: 'custom',
        path: ['configuration', 'weights'],
        message: 'Positive factor weights must total 100.',
      });
    }
    if (value.configuration.thresholds.manualReviewScore >= value.configuration.thresholds.verifiedScore) {
      context.addIssue({
        code: 'custom',
        path: ['configuration', 'thresholds'],
        message: 'Manual-review threshold must be below the verified threshold.',
      });
    }
  });
