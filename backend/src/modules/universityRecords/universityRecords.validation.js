import { z } from 'zod';
export const universityStudentParamsSchema = z.object({ studentId: z.uuid() }).strict();
export const semesterQuerySchema = z.object({ semesterCode: z.string().trim().max(30).optional() }).strict();
