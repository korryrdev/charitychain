'use strict';

import { z } from 'zod';
export const disbursementApplicationParamsSchema = z.object({ applicationId: z.uuid() }).strict();
export const disbursementParamsSchema = z.object({ disbursementId: z.uuid() }).strict();
export const createDisbursementSchema = z.object({ idempotencyKey: z.string().trim().min(16).max(100).regex(/^[A-Za-z0-9._:-]+$/) }).strict();
export const callbackSchema = z.object({ providerEventId: z.string().trim().min(3).max(200), providerRequestId: z.string().trim().min(3).max(200), resultCode: z.string().trim().max(50), resultMessage: z.string().trim().max(500), transactionId: z.string().trim().min(3).max(200).optional(), amount: z.coerce.number().positive().optional(), completedAt: z.coerce.date().optional(), raw: z.record(z.string(), z.unknown()).default({}) }).strict();
