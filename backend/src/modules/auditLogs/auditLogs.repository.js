'use strict';

import { prisma } from '@charitychain/database';

export function createAuditLogsRepository(database = prisma) {
  return {
    async append(build) {
      return database.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(24012026)`;
        const previous = await tx.auditEvent.findFirst({ orderBy: { sequence: 'desc' } });
        return tx.auditEvent.create({ data: build(previous?.eventHash ?? null) });
      });
    },
    list(filters) {
      const where = {
        ...(filters.actorId ? { actorId: filters.actorId } : {}), ...(filters.action ? { action: filters.action } : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}), ...(filters.entityId ? { entityId: filters.entityId } : {}),
        ...(filters.requestId ? { requestId: filters.requestId } : {}),
        ...(filters.from || filters.to ? { createdAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {})
      };
      return database.$transaction([database.auditEvent.findMany({ where, orderBy: { sequence: 'desc' }, skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize }), database.auditEvent.count({ where })]);
    },
    all() { return database.auditEvent.findMany({ orderBy: { sequence: 'asc' } }); }
  };
}

export const auditLogsRepository = createAuditLogsRepository();
