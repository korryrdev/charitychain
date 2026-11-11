'use strict';

import { z } from 'zod';
export const anomalyParamsSchema = z.object({ anomalyId: z.uuid() }).strict();
export const investigationUpdateSchema = z.object({ finding: z.string().min(1).max(2000).optional(), conclusion: z.string().min(1).max(4000).optional(), close: z.boolean().default(false), outcome: z.enum(['CONFIRMED', 'DISMISSED', 'RESOLVED']).optional() }).strict();
