'use strict';

import { auditEventBuilder } from './auditEventBuilder.js';
import { auditIntegrityService } from './auditIntegrity.service.js';
import { assertCanReadAudit, assertCanWriteAudit } from './auditLogs.policy.js';
import { auditLogsRepository } from './auditLogs.repository.js';

function map(event) {
  return { ...event, sequence: event.sequence.toString() };
}
function filters(input = {}) {
  const page = Math.max(1, Number.parseInt(input.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(input.pageSize, 10) || 25));
  const parseDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : undefined;
  return { actorId: input.actorId, action: input.action, entityType: input.entityType, entityId: input.entityId, requestId: input.requestId, from: parseDate(input.from), to: parseDate(input.to), page, pageSize };
}

export function createAuditLogsService({ repository = auditLogsRepository, builder = auditEventBuilder, integrity = auditIntegrityService } = {}) {
  const record = async (input) => repository.append((previousHash) => builder.build(input, previousHash));
  return {
    async record(auth, input) { assertCanWriteAudit(auth); return map(await record({ ...input, actorId: input.actorId ?? auth.user.id })); },
    async recordFromContext(context, input) { return map(await record({ ...context, ...input, actorId: input.actorId ?? context.actorId ?? null })); },
    async search(auth, input) { assertCanReadAudit(auth); const criteria = filters(input); const [items, total] = await repository.list(criteria); return { items: items.map(map), total, page: criteria.page, pageSize: criteria.pageSize }; },
    async export(auth, input) { const result = await this.search(auth, { ...input, page: 1, pageSize: 100 }); return { generatedAt: new Date(), filters: filters(input), events: result.items }; },
    async verify(auth) { assertCanReadAudit(auth); return integrity.verify(await repository.all()); }
  };
}

export const auditLogsService = createAuditLogsService();
