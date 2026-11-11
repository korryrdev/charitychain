import { describe, expect, it } from 'vitest';
import { sanitizePublicData } from '../../src/modules/transparency/publicDataSanitizer.js';
import { createTransparencyService } from '../../src/modules/transparency/transparency.service.js';

const money = (value) => ({ toString: () => String(value), valueOf: () => value });
const repository = {
  async dashboardData() {
    return {
      donations: { _sum: { amount: money(10000) }, _count: { id: 4 } },
      disbursements: { _sum: { amount: money(3500) }, _count: { id: 2 } },
      inventory: [{ availableQuantity: 12, item: { category: { name: 'Hygiene' } } }, { availableQuantity: 5, item: { category: { name: 'Hygiene' } } }, { availableQuantity: 4, item: { category: { name: 'Food' } } }],
      recognition: [{ publicAlias: 'Kind Falcon', displayNameMode: 'ALIAS', showContributionTotal: false, totalContribution: money(1000), recognitionTier: 'SILVER', user: { name: 'Private Name' } }, { publicAlias: 'Open Donor', displayNameMode: 'REAL', showContributionTotal: true, totalContribution: money(9000), recognitionTier: 'GOLD', user: { name: 'Public Name' } }],
      audit: [{ action: 'DONATION_RECONCILED', outcome: 'SUCCESS', _count: { id: 3 } }]
    };
  }
};

describe('Section 26 public transparency', () => {
  it('publishes only safe aggregate fund flow, inventory and opted-in recognition data', async () => {
    const service = createTransparencyService({ repository, policy: () => {} });
    const dashboard = await service.dashboard();
    expect(dashboard).toMatchObject({ currency: 'KES', donations: { total: 10000, count: 4 }, disbursements: { total: 3500, count: 2 }, centralPoolBalance: 6500 });
    expect(dashboard.fundFlow).toEqual([{ from: 'Public donations', to: 'CharityChain central pool', amount: 10000 }, { from: 'CharityChain central pool', to: 'Verified student support', amount: 3500 }]);
    expect(dashboard.inventory).toEqual(expect.arrayContaining([{ category: 'Hygiene', availableQuantity: 17 }, { category: 'Food', availableQuantity: 4 }]));
    expect(dashboard.recognition).toEqual([{ name: 'Kind Falcon', tier: 'SILVER' }, { name: 'Public Name', tier: 'GOLD', contributionTotal: 9000 }]);
    expect(JSON.stringify(dashboard)).not.toContain('Private Name');
  });

  it('removes protected identifiers and payment, student, contact, request and encrypted fields recursively', () => {
    const safe = sanitizePublicData({ id: 'hidden', phone: 'hidden', nested: { email: 'hidden', providerTransactionId: 'hidden', value: 1 }, rows: [{ studentId: 'hidden', name: 'Safe alias' }] });
    expect(safe).toEqual({ nested: { value: 1 }, rows: [{ name: 'Safe alias' }] });
  });

  it('does not publish anything when the transparency policy disables the feature', async () => {
    const service = createTransparencyService({ repository, policy: () => { throw new Error('disabled'); } });
    await expect(service.dashboard()).rejects.toThrow('disabled');
  });
});
