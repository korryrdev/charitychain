import { describe, expect, it } from 'vitest';
import { prisma } from '../client/prismaClient.js';

describe('database inventory integrity', () => {
  it('enforces non-negative batch invariants and queries active policies cleanly', async () => {
    const policies = await prisma.goodsCollectionPolicy.findMany({
      where: { active: true }
    });
    expect(Array.isArray(policies)).toBe(true);

    const batches = await prisma.inventoryBatch.findMany();
    for (const batch of batches) {
      expect(batch.availableQuantity).toBeGreaterThanOrEqual(0);
      expect(batch.receivedQuantity).toBeGreaterThanOrEqual(batch.availableQuantity);
    }
  });
});
