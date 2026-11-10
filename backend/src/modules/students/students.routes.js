import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { studentsController } from './students.controller.js';
import { claimStudentSchema, studentIdParamsSchema, studentListQuerySchema } from './students.validation.js';
export function createStudentsRouter(controller = studentsController) { const router = Router(); router.post('/claim', validateRequest({ body: claimStudentSchema }), controller.claim); router.get('/me', controller.mine); router.get('/', validateRequest({ query: studentListQuerySchema }), controller.list); router.get('/:studentId', validateRequest({ params: studentIdParamsSchema }), controller.get); return router; }
export const studentsRouter = createStudentsRouter();
