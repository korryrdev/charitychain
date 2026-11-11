'use strict';

import { prisma } from '@charitychain/database';
export function createTransparencyRepository(database = prisma) {
  return {
    dashboardData() {
      return Promise.all([
        database.moneyDonation.aggregate({ where: { status: { in: ['CONFIRMED', 'RECONCILED'] } }, _sum: { amount: true }, _count: { id: true } }),
        database.disbursement.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true }, _count: { id: true } }),
        database.inventoryBatch.findMany({ where: { status: 'AVAILABLE' }, select: { availableQuantity: true, item: { select: { category: { select: { name: true } } } } } }),
        database.donorProfile.findMany({ where: { publicListed: true }, take: 100, orderBy: { totalContribution: 'desc' }, select: { publicAlias: true, displayNameMode: true, showContributionTotal: true, totalContribution: true, recognitionTier: true, user: { select: { name: true } } } }),
        database.auditEvent.groupBy({ by: ['action', 'outcome'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 25 })
      ]).then(([donations, disbursements, inventory, recognition, audit]) => ({ donations, disbursements, inventory, recognition, audit }));
    }
  };
}
export const transparencyRepository = createTransparencyRepository();
