'use strict';

export function unreconciledMoneyRule({ donations = [], disbursements = [] }) {
  return [...donations.map((item) => ({ ruleCode: 'UNRECONCILED_MONEY', severity: 'HIGH', sourceType: 'DONATION', sourceId: item.id, title: 'Confirmed donation remains unreconciled', summary: 'A confirmed donation exceeded the reconciliation grace period.', evidence: { ageHours: item.ageHours, amount: item.amount.toString(), currency: item.currency } })), ...disbursements.map((item) => ({ ruleCode: 'UNRECONCILED_MONEY', severity: 'HIGH', sourceType: 'DISBURSEMENT', sourceId: item.id, title: 'Completed disbursement remains unreconciled', summary: 'A successful payout exceeded the reconciliation grace period.', evidence: { ageHours: item.ageHours, amount: item.amount.toString(), currency: item.currency } }))];
}
