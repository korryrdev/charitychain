'use strict';

import { prisma } from '@charitychain/database';
import { verifyMerkleProof } from '../../utils/merkle.js';
import { dailyDigestService } from '../auditLogs/dailyDigest.service.js';
import { formatYyyyMmDd } from '../../utils/dates.js';

export function createAuditorService({ database = prisma, digest: _digest = dailyDigestService } = {}) {
  return {
    async exportAuditStream({ fromDate, toDate, page = 1, pageSize = 100 } = {}) {
      const where = {
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate ? { gte: new Date(fromDate) } : {}),
                ...(toDate ? { lte: new Date(toDate) } : {})
              }
            }
          : {})
      };

      const [items, total] = await database.$transaction([
        database.auditEvent.findMany({
          where,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            sequence: true,
            hash: true,
            previousHash: true,
            action: true,
            entityType: true,
            entityId: true,
            createdAt: true
          }
        }),
        database.auditEvent.count({ where })
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    },

    verifyProof({ leaf, proof, root }) {
      if (!leaf || !proof || !root) {
        return { valid: false, reason: 'leaf, proof, and root are required.' };
      }
      try {
        const valid = verifyMerkleProof(leaf, proof, root);
        return { valid };
      } catch (err) {
        return { valid: false, reason: err.message };
      }
    },

    async checkChainlinkAutomation() {
      const todayYyyyMmDd = formatYyyyMmDd(new Date());
      const anchorEvent = await database.outboxEvent.findFirst({
        where: {
          eventName: 'daily_digest.anchored',
          aggregateId: String(todayYyyyMmDd)
        }
      });

      const needsDailyDigest = !anchorEvent;

      const lots = await database.donationLot.findMany({ where: { currency: 'KES' } });
      const totalInflow = lots.reduce((sum, l) => sum + l.totalAmountMinor, 0n);
      const totalRemaining = lots.reduce((sum, l) => sum + l.remainingAmountMinor, 0n);
      const allocations = await database.lotAllocation.findMany({
        where: { lot: { currency: 'KES' } }
      });
      const totalAllocated = allocations.reduce((sum, a) => sum + a.amountMinor, 0n);
      const poolDrift = totalRemaining !== totalInflow - totalAllocated;

      const upkeepNeeded = needsDailyDigest || poolDrift;
      const performData = needsDailyDigest
        ? '0x01' + Buffer.from(String(todayYyyyMmDd)).toString('hex')
        : poolDrift
        ? '0x02'
        : '0x00';

      return {
        upkeepNeeded,
        performData,
        details: {
          today: todayYyyyMmDd,
          needsDailyDigest,
          poolDrift
        }
      };
    }
  };
}

export const auditorService = createAuditorService();

