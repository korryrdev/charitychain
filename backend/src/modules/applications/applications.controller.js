import { PERMISSIONS } from '../../constants/permissions.js';
import { vettingService } from '../vetting/vetting.service.js';
import { applicationsService } from './applications.service.js';

export function createApplicationsController(
  service = applicationsService,
  vetting = vettingService
) {
  const handle = (operation) => async (req, res, next) => {
    try {
      await operation(req, res);
    } catch (error) {
      next(error);
    }
  };
  return {
    create: handle(async (req, res) =>
      res.status(201).json({ application: await service.create(req.auth, req.body) })
    ),
    updateDraft: handle(async (req, res) =>
      res.json({
        application: await service.updateDraft(req.auth, req.params.applicationId, req.body)
      })
    ),
    submit: handle(async (req, res) => {
      const submitted = await service.submit(req.auth, req.params.applicationId);
      try {
        await vetting.execute(
          { user: { id: null }, permissions: [PERMISSIONS.VETTING_EXECUTE] },
          submitted.id
        );
      } catch {
        /* Submission remains preserved for operational retry if automated vetting is unavailable. */
      }
      const application = await service.get(req.auth, submitted.id).catch(() => submitted);
      res.json({ application });
    }),
    cancel: handle(async (req, res) =>
      res.json({ application: await service.cancel(req.auth, req.params.applicationId) })
    ),
    get: handle(async (req, res) =>
      res.json({ application: await service.get(req.auth, req.params.applicationId) })
    ),
    listMine: handle(async (req, res) => res.json(await service.listMine(req.auth, req.query))),
    listAll: handle(async (req, res) => res.json(await service.listAll(req.auth, req.query))),
    transition: handle(async (req, res) =>
      res.json({
        application: await service.transition(req.auth, req.params.applicationId, req.body)
      })
    )
  };
}

export const applicationsController = createApplicationsController();
