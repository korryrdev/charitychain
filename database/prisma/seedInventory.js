import { prisma } from '../client/prismaClient.js';
import { pathToFileURL } from 'node:url';

const DEMO_DONOR = 'CharityChain demo goods intake';
const DEMO_CLERK_EMAIL = 'demo.inventory.clerk@charitychain.test';
const STOCK = [
  { code: 'SANITARY', category: 'Sanitary care', sku: 'DEMO-PADS-001', name: 'Sanitary pads', unit: 'pack', quantity: 48 },
  { code: 'HYGIENE', category: 'Personal hygiene', sku: 'DEMO-SOAP-001', name: 'Bath soap', unit: 'bar', quantity: 36 },
  { code: 'HYGIENE', category: 'Personal hygiene', sku: 'DEMO-TP-001', name: 'Toilet tissue', unit: 'roll', quantity: 60 },
  { code: 'HYGIENE', category: 'Personal hygiene', sku: 'DEMO-PASTE-001', name: 'Toothpaste', unit: 'tube', quantity: 30 }
];

const policy = {
  maximumCategories: 4,
  maximumTotalUnits: 12,
  categoryLimits: { SANITARY: 3, HYGIENE: 4, DEFAULT: 3 },
  cooldownDays: 30,
  reservationMinutes: 30,
  minimumOutstandingBalanceRatio: 0.15
};

export async function seedInventory() {
  const clerk = await prisma.user.upsert({
    where: { email: DEMO_CLERK_EMAIL },
    update: { name: 'Demo inventory clerk', emailVerified: true, status: 'ACTIVE' },
    create: { name: 'Demo inventory clerk', email: DEMO_CLERK_EMAIL, emailVerified: true, status: 'ACTIVE' }
  });
  const location = await prisma.inventoryLocation.upsert({
    where: { code: 'DEMO-DESK' },
    update: { name: 'CharityChain demonstration desk', active: true },
    create: { code: 'DEMO-DESK', name: 'CharityChain demonstration desk' }
  });
  let donation = await prisma.physicalDonation.findFirst({ where: { donorName: DEMO_DONOR }, include: { lines: true } });
  if (!donation) donation = await prisma.physicalDonation.create({
    data: {
      clerkUserId: clerk.id,
      donorName: DEMO_DONOR,
      donorPhoneEncrypted: 'demo-only',
      donorPhoneHash: 'demo-inventory-seed',
      donorPhoneLast4: '0000',
      kind: 'GOODS',
      status: 'ACCEPTED',
      submittedAt: new Date(),
      confirmedAt: new Date(),
      inspectedAt: new Date(),
      finalizedAt: new Date(),
      lines: { create: STOCK.map((item) => ({ itemName: item.name, category: item.category, lineType: 'GOODS', quantity: item.quantity, unit: item.unit, acceptedQuantity: item.quantity, inspectionStatus: 'ACCEPTED' })) }
    },
    include: { lines: true }
  });
  const activePolicy = await prisma.goodsCollectionPolicy.findFirst({ where: { active: true } });
  if (!activePolicy) await prisma.goodsCollectionPolicy.create({ data: { version: 'demo-goods-v1', configuration: policy, active: true } });
  for (const entry of STOCK) {
    const category = await prisma.inventoryCategory.upsert({ where: { code: entry.code }, update: { name: entry.category, active: true }, create: { code: entry.code, name: entry.category } });
    const item = await prisma.inventoryItem.upsert({ where: { sku: entry.sku }, update: { categoryId: category.id, name: entry.name, normalizedName: entry.name.toLowerCase(), unit: entry.unit, active: true }, create: { categoryId: category.id, sku: entry.sku, name: entry.name, normalizedName: entry.name.toLowerCase(), unit: entry.unit } });
    const sourceLine = donation.lines.find((line) => line.itemName === entry.name);
    await prisma.inventoryBatch.upsert({
      where: { batchNumber: `DEMO-${entry.sku}` },
      update: { itemId: item.id, locationId: location.id, receivedQuantity: entry.quantity, availableQuantity: entry.quantity, reservedQuantity: 0, issuedQuantity: 0, damagedQuantity: 0, status: 'AVAILABLE', expiresAt: null },
      create: { itemId: item.id, locationId: location.id, sourcePhysicalDonationLineId: sourceLine.id, batchNumber: `DEMO-${entry.sku}`, receivedQuantity: entry.quantity, availableQuantity: entry.quantity }
    });
  }
  return { location: location.name, items: STOCK.length, policy: activePolicy?.version ?? 'demo-goods-v1' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedInventory().then((summary) => console.log(JSON.stringify(summary))).finally(() => prisma.$disconnect());
}
