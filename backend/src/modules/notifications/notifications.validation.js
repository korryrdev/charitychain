'use strict';

import { z } from 'zod';
export const createNotificationSchema = z.object({ recipientUserId: z.uuid().optional(), recipientAddress: z.string().min(3).max(254), channel: z.enum(['IN_APP', 'SMS']), templateCode: z.enum(['DONATION_STATUS', 'APPLICATION_STATUS', 'APPROVAL_STATUS', 'DISBURSEMENT_STATUS', 'GOODS_COLLECTION_STATUS', 'SECURITY_ALERT']), variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}), idempotencyKey: z.string().min(8).max(120), maximumAttempts: z.number().int().min(1).max(5).default(3) }).strict();
export const notificationParamsSchema = z.object({ notificationId: z.uuid() }).strict();
export const retryNotificationSchema = z.object({ recipientAddress: z.string().min(3).max(254) }).strict();
