export function evaluateUnmetBalance(context, policy) {
  if (!context.currentFinancial) {
    return {
      factor: 'UNMET_BALANCE',
      outcome: 'WARNING',
      points: 0,
      maximumPoints: policy.weights.unmetBalance,
      rawValue: { outstandingBalance: null, invoicedAmount: null, balanceRatio: null, financialRecordSynced: false },
      evidence: [],
      explanation: 'No institutional fee statement is synced for this semester yet; manual committee verification is required.'
    };
  }
  const balance = Number(context.currentFinancial.outstandingBalance);
  const invoiced = Number(context.currentFinancial.invoicedAmount);
  const ratio = invoiced > 0 ? balance / invoiced : 0;
  const normalized = Math.min(1, ratio / policy.thresholds.balanceRatioForFullScore);
  return {
    factor: 'UNMET_BALANCE',
    outcome: normalized >= 1 ? 'PASS' : normalized > 0 ? 'PARTIAL' : 'FAIL',
    points: policy.weights.unmetBalance * normalized,
    maximumPoints: policy.weights.unmetBalance,
    rawValue: { outstandingBalance: balance, invoicedAmount: invoiced, balanceRatio: ratio },
    evidence: [{ semesterId: context.currentFinancial.semesterId, status: context.currentFinancial.status, snapshotAt: context.currentFinancial.snapshotAt }],
    explanation: balance > 0 ? `The unpaid balance is ${(ratio * 100).toFixed(1)}% of semester charges.` : 'The current semester has no unpaid fee balance.'
  };
}
