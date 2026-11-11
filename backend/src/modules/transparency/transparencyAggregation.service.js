'use strict';

const number = (value) => Number(value ?? 0);
export const transparencyAggregationService = Object.freeze({
  dashboard(data) {
    const donations = data.donations._sum.amount ?? 0;
    const disbursements = data.disbursements._sum.amount ?? 0;
    const inventory = new Map();
    for (const batch of data.inventory) {
      const category = batch.item.category.name;
      inventory.set(category, (inventory.get(category) ?? 0) + batch.availableQuantity);
    }
    return {
      generatedAt: new Date(), currency: 'KES',
      donations: { total: number(donations), count: data.donations._count.id },
      disbursements: { total: number(disbursements), count: data.disbursements._count.id },
      centralPoolBalance: number(donations) - number(disbursements),
      fundFlow: [{ from: 'Public donations', to: 'CharityChain central pool', amount: number(donations) }, { from: 'CharityChain central pool', to: 'Verified student support', amount: number(disbursements) }],
      inventory: [...inventory.entries()].map(([category, availableQuantity]) => ({ category, availableQuantity })),
      recognition: data.recognition.map((profile) => ({ name: profile.displayNameMode === 'REAL' ? profile.user.name : profile.publicAlias, tier: profile.recognitionTier, ...(profile.showContributionTotal ? { contributionTotal: number(profile.totalContribution) } : {}) })),
      audit: data.audit.map((item) => ({ action: item.action, outcome: item.outcome, count: item._count.id }))
    };
  }
});
