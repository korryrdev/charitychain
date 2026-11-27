import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { complaintsController } from './complaints.controller.js';
import {
  complaintIdParamsSchema,
  createAppealSchema,
  createComplaintSchema,
  resolveComplaintSchema,
} from './complaints.validation.js';

export function createComplaintsRouter(controller = complaintsController) {
  const router = Router();
  router.get('/appeals/mine', controller.myAppeals);
  router.post(
    '/appeals',
    validateRequest({ body: createAppealSchema }),
    controller.createAppeal
  );
  router.get('/mine', authorize(PERMISSIONS.COMPLAINT_CREATE), controller.listMine);
  router.post(
    '/',
    authorize(PERMISSIONS.COMPLAINT_CREATE),
    validateRequest({ body: createComplaintSchema }),
    controller.submitAuthenticated
  );
  router.get('/', authorize(PERMISSIONS.COMPLAINT_MANAGE), controller.listAll);
  router.patch(
    '/:id/resolve',
    authorize(PERMISSIONS.COMPLAINT_MANAGE),
    validateRequest({ params: complaintIdParamsSchema, body: resolveComplaintSchema }),
    controller.resolve
  );
  return router;
}

export const complaintsRouter = createComplaintsRouter();
