'use strict';

import { z } from 'zod';
export const goodsCollectionParamsSchema = z.object({ collectionId: z.uuid() }).strict();
export const createGoodsCollectionSchema = z.object({ registrationNumber: z.string().trim().min(4).max(50), lines: z.array(z.object({ batchId: z.uuid(), quantity: z.coerce.number().int().positive() }).strict()).min(1).max(4) }).strict();
export const goodsConfirmationSchema = z.object({ token: z.string().min(20).max(200), decision: z.enum(['YES','NO']) }).strict();
