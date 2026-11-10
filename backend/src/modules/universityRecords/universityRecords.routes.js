import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { universityRecordsController } from './universityRecords.controller.js';
import { semesterQuerySchema, universityStudentParamsSchema } from './universityRecords.validation.js';
export function createUniversityRecordsRouter(controller = universityRecordsController) { const router = Router(); router.get('/me', controller.mine); router.get('/:studentId/exams', validateRequest({ params: universityStudentParamsSchema, query: semesterQuerySchema }), controller.exams); router.get('/:studentId', validateRequest({ params: universityStudentParamsSchema }), controller.get); return router; }
export const universityRecordsRouter = createUniversityRecordsRouter();
