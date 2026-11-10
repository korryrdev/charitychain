import { prisma } from '@charitychain/database';
import { afterAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { batchAndExpiryService } from '../../src/modules/inventory/batchAndExpiry.service.js';
import { inventoryService } from '../../src/modules/inventory/inventory.service.js';
import { reservationService } from '../../src/modules/inventory/reservation.service.js';
import { stockCountService } from '../../src/modules/inventory/stockCount.service.js';
import { physicalDonationInspectionService } from '../../src/modules/physicalDonations/physicalDonationInspection.service.js';
import { physicalDonationsService } from '../../src/modules/physicalDonations/physicalDonations.service.js';

const run = Date.now();
let clerk;
let inspector;
let manager;
let donation;
let location;
let batch;
const clerkAuth = () => ({ user: clerk, permissions: [PERMISSIONS.PHYSICAL_DONATION_RECORD] });
const inspectorAuth = () => ({ user: inspector, permissions: [PERMISSIONS.PHYSICAL_DONATION_INSPECT] });
const managerAuth = () => ({ user: manager, permissions: [PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_MANAGE] });

afterAll(async () => {
  const userIds = [clerk?.id, inspector?.id, manager?.id].filter(Boolean);
  const batches = await prisma.inventoryBatch.findMany({ where: { sourcePhysicalDonationLine: { donation: { clerkUserId: { in: userIds } } } }, select: { id: true, itemId: true, locationId: true } });
  const batchIds = batches.map(({ id }) => id);
  await prisma.stockCountLine.deleteMany({ where: { batchId: { in: batchIds } } });
  await prisma.stockCount.deleteMany({ where: { locationId: { in: batches.map(({ locationId }) => locationId) } } });
  await prisma.stockMovement.deleteMany({ where: { batchId: { in: batchIds } } });
  await prisma.inventoryReservation.deleteMany({ where: { batchId: { in: batchIds } } });
  await prisma.inventoryBatch.deleteMany({ where: { id: { in: batchIds } } });
  await prisma.inventoryItem.deleteMany({ where: { id: { in: batches.map(({ itemId }) => itemId) } } });
  await prisma.inventoryCategory.deleteMany({ where: { code: { startsWith: `TEST_${run}` } } });
  await prisma.inventoryLocation.deleteMany({ where: { code: { startsWith: `TEST-${run}` } } });
  const physical = await prisma.physicalDonation.findMany({ where: { clerkUserId: { in: userIds } }, select: { id: true } });
  const physicalIds = physical.map(({ id }) => id);
  await prisma.physicalDonationInspection.deleteMany({ where: { physicalDonationId: { in: physicalIds } } });
  await prisma.physicalDonationLine.deleteMany({ where: { physicalDonationId: { in: physicalIds } } });
  await prisma.physicalDonation.deleteMany({ where: { id: { in: physicalIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe('Section 13 inventory and append-only stock control', () => {
  it('rejects unconfirmed goods and receives accepted lines exactly once', async () => {
    clerk = (await authService.register({ name: 'Inventory Clerk', email: `inventory-clerk-${run}@example.test`, password: 'Section13-Strong-Password-42!' })).user;
    inspector = (await authService.register({ name: 'Inventory Inspector', email: `inventory-inspector-${run}@example.test`, password: 'Section13-Strong-Password-42!' })).user;
    manager = (await authService.register({ name: 'Inventory Manager', email: `inventory-manager-${run}@example.test`, password: 'Section13-Strong-Password-42!' })).user;
    location = await inventoryService.createLocation(managerAuth(), { code: `TEST-${run}-MAIN`, name: 'Test Main Store' });
    donation = await physicalDonationsService.create(clerkAuth(), { donorName: 'Inventory Donor', donorPhone: '254712345678', kind: 'GOODS', lines: [{ lineType: 'GOODS', itemName: 'Bathing soap', category: 'Hygiene', quantity: 10, unit: 'bars' }] });
    await expect(inventoryService.receivePhysicalDonation(managerAuth(), donation.id, { locationId: location.id, lines: [] })).rejects.toMatchObject({ code: 'CONFLICT' });
    donation = await physicalDonationsService.submit(clerkAuth(), donation.id);
    donation = await physicalDonationsService.recordDonorDecision(donation.id, true);
    donation = await physicalDonationInspectionService.inspect(inspectorAuth(), donation.id, { decision: 'ACCEPTED', lines: [{ lineId: donation.lines[0].id, acceptedQuantity: 10, approvedUnitValue: 75 }] });
    const input = { locationId: location.id, lines: [{ lineId: donation.lines[0].id, categoryCode: `TEST_${run}_HYGIENE`, categoryName: 'Hygiene', sku: `TEST-${run}-SOAP`, batchNumber: `BATCH-${run}-1`, expiresAt: new Date(Date.now() + 86400000) }] };
    [batch] = await inventoryService.receivePhysicalDonation(managerAuth(), donation.id, input);
    const [replay] = await inventoryService.receivePhysicalDonation(managerAuth(), donation.id, input);
    expect(replay.id).toBe(batch.id);
    expect(batch).toMatchObject({ receivedQuantity: 10, availableQuantity: 10, reservedQuantity: 0, status: 'AVAILABLE' });
    expect(await prisma.stockMovement.count({ where: { batchId: batch.id, type: 'RECEIPT' } })).toBe(1);
  }, 30_000);

  it('prevents oversubscription and records reservation release and issue movements', async () => {
    await expect(reservationService.reserve(managerAuth(), { batchId: batch.id, targetType: 'TEST', targetId: 'too-large', quantity: 11, expiresAt: new Date(Date.now() + 60000) })).rejects.toMatchObject({ code: 'CONFLICT' });
    const reservation = await reservationService.reserve(managerAuth(), { batchId: batch.id, targetType: 'TEST', targetId: 'release-me', quantity: 4, expiresAt: new Date(Date.now() + 60000) });
    const replay = await reservationService.reserve(managerAuth(), { batchId: batch.id, targetType: 'TEST', targetId: 'release-me', quantity: 4, expiresAt: new Date(Date.now() + 60000) });
    expect(replay.id).toBe(reservation.id);
    await reservationService.release(managerAuth(), reservation.id);
    const issue = await reservationService.reserve(managerAuth(), { batchId: batch.id, targetType: 'TEST', targetId: 'issue-me', quantity: 3, expiresAt: new Date(Date.now() + 60000) });
    await reservationService.fulfill(managerAuth(), issue.id);
    const stored = await prisma.inventoryBatch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(stored).toMatchObject({ availableQuantity: 7, reservedQuantity: 0, issuedQuantity: 3 });
    expect((await prisma.stockMovement.findMany({ where: { batchId: batch.id }, orderBy: { createdAt: 'asc' } })).map((movement) => movement.type)).toEqual(['RECEIPT','RESERVE','RELEASE','RESERVE','ISSUE']);
  }, 30_000);

  it('requires reasoned adjustments and records stock-count correction', async () => {
    await expect(inventoryService.adjust(managerAuth(), batch.id, { quantity: -8, reason: 'Invalid excessive reduction', referenceId: 'ADJ-NEGATIVE' })).rejects.toMatchObject({ code: 'CONFLICT' });
    await inventoryService.adjust(managerAuth(), batch.id, { quantity: 2, reason: 'Recovered sealed stock', referenceId: 'ADJ-SECTION13-1' });
    const count = await stockCountService.count(managerAuth(), { locationId: location.id, notes: 'Quarterly verification', lines: [{ batchId: batch.id, countedQuantity: 8, reason: 'One damaged bar found' }] });
    expect(count.status).toBe('CLOSED');
    expect(count.lines[0]).toMatchObject({ expectedQuantity: 9, countedQuantity: 8, variance: -1 });
    expect((await prisma.inventoryBatch.findUniqueOrThrow({ where: { id: batch.id } })).availableQuantity).toBe(8);
    expect(await prisma.stockMovement.count({ where: { batchId: batch.id, type: 'COUNT_CORRECTION' } })).toBe(1);
  }, 30_000);

  it('expires available stock and preserves its movement evidence', async () => {
    await prisma.inventoryBatch.update({ where: { id: batch.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await batchAndExpiryService.expireDue(new Date(), manager.id);
    expect(expired.map(({ id }) => id)).toContain(batch.id);
    const stored = await prisma.inventoryBatch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(stored).toMatchObject({ status: 'EXPIRED', availableQuantity: 0, damagedQuantity: 8 });
    expect(await prisma.stockMovement.count({ where: { batchId: batch.id, type: 'EXPIRY' } })).toBe(1);
    await expect(inventoryService.adjust(managerAuth(), batch.id, { quantity: 1, reason: 'Should remain closed', referenceId: 'ADJ-EXPIRED' })).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);
});
