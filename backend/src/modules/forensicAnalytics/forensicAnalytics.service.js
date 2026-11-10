'use strict';

import { createHash } from 'node:crypto';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { assertCanInvestigate, assertCanReadForensics } from './forensicAnalytics.policy.js';
import { forensicRepository } from './forensicAnalytics.repository.js';
import { createInvestigationService } from './investigation.service.js';
import { approvalConflictRule } from './rules/approvalConflict.rule.js';
import { disbursementSpikeRule } from './rules/disbursementSpike.rule.js';
import { duplicateCallbackRule } from './rules/duplicateCallback.rule.js';
import { inventoryVarianceRule } from './rules/inventoryVariance.rule.js';
import { repeatedConfirmationFailureRule } from './rules/repeatedConfirmationFailure.rule.js';
import { unreconciledMoneyRule } from './rules/unreconciledMoney.rule.js';
import { unusualClerkActivityRule } from './rules/unusualClerkActivity.rule.js';

const allRules = [unreconciledMoneyRule, duplicateCallbackRule, repeatedConfirmationFailureRule, inventoryVarianceRule, disbursementSpikeRule, approvalConflictRule, unusualClerkActivityRule];
const fingerprint = (item) => createHash('sha256').update(JSON.stringify({ ruleCode: item.ruleCode, sourceType: item.sourceType, sourceId: item.sourceId, evidence: item.evidence })).digest('hex');
const map = (item) => ({ ...item, id: item.id, detectedAt: item.detectedAt, lastSeenAt: item.lastSeenAt, investigation: item.investigation ?? null });
function notFound() { return new AppError({ message: 'Forensic anomaly not found.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 }); }

export function createForensicAnalyticsService({ repository = forensicRepository, rules = allRules, investigation = createInvestigationService(repository) } = {}) {
  return {
    async scan(auth, now = new Date()) {
      assertCanInvestigate(auth);
      const data = await repository.scanData(now);
      const candidates = rules.flatMap((rule) => rule(data));
      const anomalies = await Promise.all(candidates.map((item) => repository.upsert({ ...item, fingerprint: fingerprint(item) })));
      return { scannedAt: now, detected: anomalies.length, anomalies: anomalies.map(map) };
    },
    async list(auth, query = {}) { assertCanReadForensics(auth); const page = Math.max(1, Number.parseInt(query.page, 10) || 1); const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize, 10) || 25)); const [items, total] = await repository.list({ ...query, page, pageSize }); return { items: items.map(map), total, page, pageSize }; },
    async get(auth, id) { assertCanReadForensics(auth); const anomaly = await repository.find(id); if (!anomaly) throw notFound(); return map(anomaly); },
    async openInvestigation(auth, id) { assertCanInvestigate(auth); const anomaly = await repository.find(id); if (!anomaly) throw notFound(); await investigation.open(anomaly, auth.user.id); return map(await repository.find(id)); },
    async updateInvestigation(auth, id, input) { assertCanInvestigate(auth); const anomaly = await repository.find(id); if (!anomaly) throw notFound(); return map(await investigation.update(anomaly, input)); }
  };
}
export const forensicAnalyticsService = createForensicAnalyticsService();
