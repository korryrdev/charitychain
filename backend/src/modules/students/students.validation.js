import { z } from 'zod';
export const claimStudentSchema = z.object({ registrationNumber: z.string().trim().toUpperCase().regex(/^MUST\/SIM\/2026\/\d{3}$/) }).strict();
export const studentIdParamsSchema = z.object({ studentId: z.uuid() }).strict();
export const studentListQuerySchema = z.object({ programme: z.string().trim().max(100).optional(), academicStatus: z.enum(['ACTIVE','DEFERRED','SUSPENDED','COMPLETED']).optional(), simulationProfile: z.enum(['MICRO_PAYMENT_HARDSHIP','EXAM_PERIOD_DISTRESS','AID_GAP_RELIANCE','CHRONIC_HIGH_BALANCE','STABLE_LUMP_SUM_CONTROL','MIXED_CONTROL']).optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().positive().max(100).default(25) }).strict();
