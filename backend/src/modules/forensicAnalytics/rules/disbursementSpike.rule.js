'use strict';

export function disbursementSpikeRule({ totals = [] }, { amountThreshold = 100000, countThreshold = 10 } = {}) {
  return totals.filter((item) => Number(item._sum.amount ?? 0) >= amountThreshold || item._count.id >= countThreshold).map((item) => ({ ruleCode: 'DISBURSEMENT_SPIKE', severity: 'HIGH', sourceType: 'DISBURSEMENT_PROVIDER', sourceId: item.provider, title: 'Disbursement volume spike', summary: 'Successful payouts exceeded the configured volume threshold in the detection window.', evidence: { provider: item.provider, count: item._count.id, amount: item._sum.amount?.toString() ?? '0' } }));
}
