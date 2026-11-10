'use strict';

import { z } from 'zod';
export const reconciliationRunParamsSchema = z.object({ runId: z.uuid() }).strict();
export const executeReconciliationSchema = z.object({ scope: z.enum(['DONATIONS','DISBURSEMENTS','ALL']).default('ALL'), periodStart: z.coerce.date(), periodEnd: z.coerce.date() }).strict().superRefine((value, context) => { if (value.periodEnd <= value.periodStart) context.addIssue({ code: 'custom', path: ['periodEnd'], message: 'Period end must be after period start.' }); if (value.periodEnd > new Date()) context.addIssue({ code: 'custom', path: ['periodEnd'], message: 'Reconciliation period cannot end in the future.' }); });
