import { describe, expect, it } from 'vitest';
import { prisma } from '../client/prismaClient.js';

describe('database inventory integrity', () => {
  it('retains seeded physical goods catalog, batches, and active collection policy', async () => {
    const activePolicy = await prisma.goodsCollectionPolicy.findFirst({ where: { active: true } });
    expect(activePolicy).not.toBeNull();

    const batches = await prisma.inventoryBatch.findMany();
    expect(batches.length).toBeGreaterThanOrEqual(4);
    for (const batch of batches) {
      expect(batch.availableQuantity).toBeGreaterThanOrEqual(0);
      expect(batch.receivedQuantity).toBeGreaterThanOrEqual(batch.availableQuantity);
    }
  });
});
