'use strict';

import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

export function createInvestigationService(repository) {
  return {
    async open(anomaly, actorId) { return repository.openInvestigation(anomaly.id, actorId); },
    async update(anomaly, input) {
      if (!anomaly.investigation) throw new AppError({ message: 'Open an investigation before adding findings.', code: ERROR_CODES.CONFLICT, statusCode: 409 });
      const findings = [...(anomaly.investigation.findings ?? []), ...(input.finding ? [{ note: input.finding, at: new Date().toISOString() }] : [])];
      await repository.updateInvestigation(anomaly.investigation.id, { findings, ...(input.conclusion ? { conclusion: input.conclusion } : {}), ...(input.close ? { status: 'CLOSED', closedAt: new Date() } : {}) });
      return repository.updateAnomaly(anomaly.id, input.close ? { status: input.outcome ?? 'RESOLVED', resolvedAt: new Date() } : { status: 'INVESTIGATING' });
    }
  };
}
