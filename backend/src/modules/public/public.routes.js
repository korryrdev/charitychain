'use strict';

import { Router } from 'express';
import { publicService } from './public.service.js';
import { dailyDigestService } from '../auditLogs/dailyDigest.service.js';
import { auditorService } from './auditor.service.js';
import { certificateService } from './certificate.service.js';
import { donorClaimService } from '../donors/donorClaim.service.js';
import { recognitionWallService } from '../donors/recognitionWall.service.js';

export function createPublicEndpointsRouter({
  service = publicService,
  digest = dailyDigestService,
  auditor = auditorService,
  cert = certificateService,
  claim = donorClaimService,
  recognition = recognitionWallService
} = {}) {
  const router = Router();

  router.get('/trace/:receipt', async (req, res, next) => {
    try {
      const trace = await service.getTrace(req.params.receipt);
      if (!trace) {
        return res.status(404).json({ message: 'Receipt code or transaction not found.' });
      }
      res.status(200).json(trace);
    } catch (err) {
      next(err);
    }
  });

  router.get('/stats', async (req, res, next) => {
    try {
      const stats = await service.getStats();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  });

  router.get('/digest/:day', async (req, res, next) => {
    try {
      const result = await digest.computeDigest(req.params.day);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/digest/:day/proof/:eventId', async (req, res, next) => {
    try {
      const proof = await digest.getEventProof(req.params.day, req.params.eventId);
      if (!proof) {
        return res.status(404).json({ message: 'Event not found on that day.' });
      }
      res.status(200).json(proof);
    } catch (err) {
      next(err);
    }
  });

  router.get('/audit/export', async (req, res, next) => {
    try {
      const exportData = await auditor.exportAuditStream({
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 100
      });
      res.status(200).json(exportData);
    } catch (err) {
      next(err);
    }
  });

  router.post('/verify-proof', async (req, res, next) => {
    try {
      const result = auditor.verifyProof(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/chainlink/automation', async (req, res, next) => {
    try {
      const result = await auditor.checkChainlinkAutomation();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/certificate/:receipt', async (req, res, next) => {
    try {
      const certData = await cert.generateCertificate(req.params.receipt);
      if (req.query.format === 'svg') {
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.status(200).send(certData.svg);
      }
      res.status(200).json(certData);
    } catch (err) {
      next(err);
    }
  });

  router.post('/donor/claim', async (req, res, next) => {
    try {
      const result = await claim.claimReceipt(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/donor/me', async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/, '') || req.query.token;
      if (!token) return res.status(401).json({ message: 'Claim token is required.' });
      const dashboard = await claim.getDonorDashboard(token);
      res.status(200).json(dashboard);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/donor/preferences', async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/, '') || req.body.token;
      if (!token) return res.status(401).json({ message: 'Claim token is required.' });
      const updated = await claim.updatePreferences(token, req.body);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.get('/recognition', async (req, res, next) => {
    try {
      const wall = await recognition.getRecognitionWall();
      res.status(200).json(wall);
    } catch (err) {
      next(err);
    }
  });

  router.post('/recognition/:id/report', async (req, res, next) => {
    try {
      const result = await recognition.reportName(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export const publicEndpointsRouter = createPublicEndpointsRouter();
export default publicEndpointsRouter;
