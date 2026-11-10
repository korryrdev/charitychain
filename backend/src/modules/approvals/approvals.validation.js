'use strict';

import { z } from 'zod';
export const approvalApplicationParamsSchema = z.object({ applicationId: z.uuid() }).strict();
export const approvalRoundParamsSchema = z.object({ roundId: z.uuid() }).strict();
export const openApprovalSchema = z.object({ reason: z.string().trim().min(10).max(500) }).strict();
export const decisionSchema = z.object({ decision: z.enum(['APPROVE','DECLINE']), rationale: z.string().trim().min(15).max(1000) }).strict();
