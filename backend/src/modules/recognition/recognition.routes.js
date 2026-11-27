import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '../../constants/permissions.js';
import { requestAuditContext } from '../../middleware/auditContext.js';
import { authorize, authorizeAny } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { badgesService, GOVERNED_BADGE_TIERS } from '../donors/badges.service.js';
import { recognitionWallService } from '../donors/recognitionWall.service.js';
import { recognitionController } from './recognition.controller.js';
import { recognitionHistoryQuerySchema } from './recognition.validation.js';

const takedownParamsSchema = z.object({ id: z.uuid() });
const takedownBodySchema = z.object({ reason: z.string().trim().min(5).max(500) }).strict();
const proposeTierBodySchema = z
  .object({
    tier: z.enum(GOVERNED_BADGE_TIERS),
    thresholdKes: z.coerce.number().positive().optional(),
    thresholdMinor: z.union([z.coerce.number().int().positive(), z.string().regex(/^\d+$/)]).optional(),
  })
  .strict()
  .refine((data) => data.thresholdKes !== undefined || data.thresholdMinor !== undefined, {
    message: 'Provide thresholdKes or thresholdMinor.',
  });
const tierParamsSchema = z.object({
  tier: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(GOVERNED_BADGE_TIERS)),
});

export function createRecognitionRouter(
  controller = recognitionController,
  { wall = recognitionWallService, badges = badgesService } = {}
) {
  const router = Router();
  router.get('/me', controller.mine);
  router.get(
    '/me/history',
    validateRequest({ query: recognitionHistoryQuerySchema }),
    controller.history
  );

  router.get(
    '/names',
    authorize(PERMISSIONS.RECOGNITION_MODERATE),
    async (_req, res, next) => {
      try {
        res.json(await wall.listPublicEntriesForModeration());
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/names/:id/takedown',
    authorize(PERMISSIONS.RECOGNITION_MODERATE),
    validateRequest({ params: takedownParamsSchema, body: takedownBodySchema }),
    async (req, res, next) => {
      try {
        const result = await wall.takedownName(req.params.id, {
          reason: req.body.reason,
          actorUserId: req.auth.user.id,
          context: requestAuditContext(req),
        });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/badge-tiers',
    authorizeAny(
      PERMISSIONS.BADGE_TIER_MANAGE,
      PERMISSIONS.COMMITTEE_MANAGE,
      PERMISSIONS.RECOGNITION_MODERATE,
      PERMISSIONS.REPORT_READ
    ),
    async (_req, res, next) => {
      try {
        res.json(await badges.listTierGovernance());
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/badge-tiers/propose',
    authorize(PERMISSIONS.BADGE_TIER_MANAGE),
    validateRequest({ body: proposeTierBodySchema }),
    async (req, res, next) => {
      try {
        const thresholdMinor =
          req.body.thresholdMinor !== undefined
            ? BigInt(req.body.thresholdMinor)
            : BigInt(Math.round(req.body.thresholdKes * 100));
        const result = await badges.proposeTierChange({
          tier: req.body.tier,
          thresholdMinor,
          proposedByUserId: req.auth.user.id,
          context: requestAuditContext(req),
        });
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/badge-tiers/:tier/approve',
    authorize(PERMISSIONS.BADGE_TIER_MANAGE),
    validateRequest({ params: tierParamsSchema }),
    async (req, res, next) => {
      try {
        const result = await badges.approveTierChange({
          tier: req.params.tier,
          approvedByUserId: req.auth.user.id,
          context: requestAuditContext(req),
        });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/badge-tiers/recompute',
    authorize(PERMISSIONS.BADGE_TIER_MANAGE),
    async (req, res, next) => {
      try {
        const academicYear =
          typeof req.body?.academicYear === 'string' && req.body.academicYear.trim()
            ? req.body.academicYear.trim()
            : '2025/2026';
        res.status(200).json(await badges.recomputeAll(academicYear));
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

export function createPublicRecognitionRouter(controller = recognitionController) {
  const router = Router();
  router.get('/tiers', controller.tiers);
  return router;
}

export const recognitionRouter = createRecognitionRouter();
export const publicRecognitionRouter = createPublicRecognitionRouter();
