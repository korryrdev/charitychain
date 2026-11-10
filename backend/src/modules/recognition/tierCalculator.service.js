import { Prisma } from '@prisma/client';

export function calculateTier(totalValue, tiers) {
  const total = new Prisma.Decimal(totalValue);
  return (
    [...tiers]
      .filter((tier) => tier.active && total.greaterThanOrEqualTo(tier.minimumValue))
      .sort((first, second) => second.rank - first.rank)[0]?.code ?? 'UNRANKED'
  );
}
