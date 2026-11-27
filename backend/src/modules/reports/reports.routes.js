'use strict';

import { Router } from 'express';
import { reportsService } from './reports.service.js';
import { renderQuarterlyReportPdf } from './reportPdf.service.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';

export function createReportsRouter(service = reportsService) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const reports = await service.listPublicReports();
      res.status(200).json({ items: reports });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/quarterly',
    authorize(PERMISSIONS.REPORT_GENERATE),
    async (req, res, next) => {
      try {
        const { year, quarter } = req.body;
        const report = await service.generateQuarterlyReport({
          year,
          quarter,
          generatedByUserId: req.auth.user.id,
        });
        res.status(201).json({ report });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/:id/pdf', async (req, res, next) => {
    try {
      const report = await service.getReport(req.params.id);
      const pdfBuffer = renderQuarterlyReportPdf(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="charitychain-report-${report.year}-Q${report.quarter}-v${report.version}.pdf"`
      );
      res.status(200).send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const report = await service.getReport(req.params.id);
      res.status(200).json({ report });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export const reportsRouter = createReportsRouter();
export default reportsRouter;
