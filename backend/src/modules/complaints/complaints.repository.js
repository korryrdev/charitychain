'use strict';

import { prisma } from '@charitychain/database';

export function createComplaintsRepository(database = prisma) {
  return {
    async createCaseAlert({
      ruleId,
      severity,
      riskScore,
      entityType,
      entityId = null,
      description,
      metadata,
      actorUserId = null,
    }) {
      return database.forensicAlert.create({
        data: {
          ruleId,
          severity,
          riskScore,
          entityType,
          entityId,
          description,
          status: 'OPEN',
          events: {
            create: {
              fromStatus: 'NONE',
              toStatus: 'OPEN',
              actorUserId,
              notes: JSON.stringify(metadata ?? {}),
            },
          },
        },
        include: {
          events: { orderBy: { createdAt: 'asc' } },
        },
      });
    },

    async listByRuleIds(ruleIds, { status, page = 1, pageSize = 50 } = {}) {
      const normalizedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
      const normalizedPageSize = Math.min(
        100,
        Math.max(1, Number.parseInt(String(pageSize), 10) || 50)
      );

      const where = {
        ruleId: { in: ruleIds },
        ...(status ? { status } : {}),
      };

      return database.forensicAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (normalizedPage - 1) * normalizedPageSize,
        take: normalizedPageSize,
        include: {
          events: { orderBy: { createdAt: 'asc' } },
        },
      });
    },

    findById(id) {
      return database.forensicAlert.findUnique({
        where: { id },
        include: {
          events: { orderBy: { createdAt: 'asc' } },
        },
      });
    },

    async updateStatusWithEvent(id, { fromStatus, status, actorUserId = null, notes }) {
      const [updated] = await database.$transaction([
        database.forensicAlert.update({
          where: { id },
          data: { status },
          include: { events: { orderBy: { createdAt: 'asc' } } },
        }),
        database.forensicAlertEvent.create({
          data: {
            alertId: id,
            fromStatus,
            toStatus: status,
            actorUserId,
            notes,
          },
        }),
      ]);
      return this.findById(updated.id) ?? updated;
    },
  };
}

export const complaintsRepository = createComplaintsRepository();
