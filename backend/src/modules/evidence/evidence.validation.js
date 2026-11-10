'use strict';

import { z } from 'zod';

const subjectTypes = ['DONATION', 'DISBURSEMENT', 'GOODS_COLLECTION', 'APPLICATION', 'VETTING', 'RECONCILIATION'];
const evidenceTypes = ['DONATION_RECEIPT', 'DISBURSEMENT_RECEIPT', 'GOODS_HANDOVER', 'APPLICATION_DECISION', 'VETTING_DECISION', 'RECONCILIATION_REPORT'];

export const createEvidenceSchema = z.object({
  subjectType: z.enum(subjectTypes),
  subjectId: z.uuid(),
  evidenceType: z.enum(evidenceTypes),
  sensitivity: z.enum(['INTERNAL', 'RESTRICTED']).default('RESTRICTED'),
  retentionDays: z.number().int().min(30).max(3650).optional(),
  content: z.json()
}).strict();

export const evidenceParamsSchema = z.object({ evidenceId: z.uuid() }).strict();
export const evidenceSubjectParamsSchema = z.object({
  subjectType: z.enum(subjectTypes), subjectId: z.uuid()
}).strict();
