import { describe, expect, it } from 'vitest';
import { prisma } from '../client/prismaClient.js';

describe('database ledger invariants', () => {
  it('maintains non-negative integer minor-unit conservation on every donation lot', async () => {
    const lots = await prisma.donationLot.findMany({
      include: { allocations: { select: { amountMinor: true } } }
    });
    for (const lot of lots) {
      expect(lot.totalAmountMinor).toBeGreaterThan(0n);
      expect(lot.remainingAmountMinor).toBeGreaterThanOrEqual(0n);
      expect(lot.remainingAmountMinor).toBeLessThanOrEqual(lot.totalAmountMinor);
      const allocated = lot.allocations.reduce((sum, item) => sum + item.amountMinor, 0n);
      expect(lot.totalAmountMinor - lot.remainingAmountMinor).toBe(allocated);
    }
  });
});
