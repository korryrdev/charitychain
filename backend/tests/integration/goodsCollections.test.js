import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { createCollectionConfirmationService } from '../../src/modules/goodsCollections/collectionConfirmation.service.js';
import { createGoodsCollectionsService } from '../../src/modules/goodsCollections/goodsCollections.service.js';
import { goodsReleaseService } from '../../src/modules/goodsCollections/goodsRelease.service.js';

const run = Date.now();
const sent = [];
const smsProvider = { name: 'test-sms', async send(message) { sent.push(message); return { providerMessageId: `goods-sms-${run}-${sent.length}` }; } };
const confirmation = createCollectionConfirmationService({ smsProvider, ttlMinutes: 15 });
const service = createGoodsCollectionsService({ confirmation });
let clerk;
let releaser;
let studentUser;
let stableUser;
let student;
let stableStudent;
let semester;
let location;
let physicalDonation;
const batches = [];
let rejectedCollection;
let releasedCollection;

const clerkAuth = () => ({ user: clerk, permissions: [PERMISSIONS.GOODS_COLLECTION_RECORD, PERMISSIONS.INVENTORY_READ] });
const releaserAuth = () => ({ user: releaser, permissions: [PERMISSIONS.GOODS_COLLECTION_RELEASE] });
const noPermissions = () => ({ user: clerk, permissions: [] });
const tokenFromLastSms = () => decodeURIComponent(sent.at(-1).message.match(/token=([^\s]+)/)[1]);
async function register(name) { return (await authService.register({ name, email: `${name.toLowerCase().replaceAll(' ','-')}-${run}@example.test`, password: 'Section20-Strong-Password-42!' })).user; }

beforeAll(async () => {
  [clerk, releaser, studentUser, stableUser] = await Promise.all([register('Goods Clerk'), register('Goods Releaser'), register('Goods Eligible Student'), register('Goods Stable Student')]);
  semester = await prisma.academicSemester.findFirstOrThrow({ where: { active: true }, orderBy: { startsAt: 'desc' } });
  student = await prisma.student.create({ data: { userId: studentUser.id, registrationNumber: `MUST/GOODS/${run}/1`, fullName: 'Goods Eligible Student', programme: 'BSC-GOODS-TEST', school: 'School of Computing and Informatics', yearOfStudy: 3, academicStatus: 'ACTIVE', simulationProfile: 'AID_GAP_RELIANCE', admittedAt: new Date('2023-09-01'), expectedGraduation: new Date('2027-06-30'), verifiedPhone: '254711111111', phoneVerifiedAt: new Date() } });
  stableStudent = await prisma.student.create({ data: { userId: stableUser.id, registrationNumber: `MUST/GOODS/${run}/2`, fullName: 'Goods Stable Student', programme: 'BSC-GOODS-TEST', school: 'School of Computing and Informatics', yearOfStudy: 3, academicStatus: 'ACTIVE', simulationProfile: 'STABLE_LUMP_SUM_CONTROL', admittedAt: new Date('2023-09-01'), expectedGraduation: new Date('2027-06-30'), verifiedPhone: '254722222222', phoneVerifiedAt: new Date() } });
  await prisma.studentFinancialRecord.createMany({ data: [
    { studentId: student.id, semesterId: semester.id, invoicedAmount: 30000, paidAmount: 5000, aidAmount: 8000, outstandingBalance: 25000, status: 'BLOCKED' },
    { studentId: stableStudent.id, semesterId: semester.id, invoicedAmount: 30000, paidAmount: 30000, aidAmount: 0, outstandingBalance: 0, status: 'CLEARED' }
  ] });
  await prisma.studentAidRecord.create({ data: { studentId: student.id, semesterId: semester.id, aidType: 'NGO_SPONSORSHIP', providerName: 'Education Support NGO', awardedAmount: 8000, disbursedAmount: 8000, status: 'DISBURSED', reference: `GOODS-AID-${run}`, disbursedAt: new Date() } });
  location = await prisma.inventoryLocation.create({ data: { code: `GOODS-${run}`, name: 'Goods Collection Test Store' } });
  physicalDonation = await prisma.physicalDonation.create({ data: { clerkUserId: clerk.id, donorName: 'Goods Inventory Donor', donorPhoneEncrypted: 'encrypted-placeholder', donorPhoneHash: `hash-${run}`, donorPhoneLast4: '5678', kind: 'GOODS', status: 'ACCEPTED', inspectedAt: new Date(), finalizedAt: new Date() } });
  for (const [index, definition] of [{ code: 'PADS', name: 'Sanitary pads', unit: 'packs', quantity: 20 }, { code: 'TISSUE', name: 'Tissue paper', unit: 'rolls', quantity: 20 }].entries()) {
    const category = await prisma.inventoryCategory.upsert({ where: { code: definition.code }, update: {}, create: { code: definition.code, name: definition.name } });
    const item = await prisma.inventoryItem.create({ data: { categoryId: category.id, sku: `GOODS-${run}-${definition.code}`, name: definition.name, normalizedName: `${definition.name.toLowerCase()}-${run}`, unit: definition.unit } });
    const line = await prisma.physicalDonationLine.create({ data: { physicalDonationId: physicalDonation.id, lineType: 'GOODS', itemName: definition.name, category: definition.code, quantity: definition.quantity, unit: definition.unit, acceptedQuantity: definition.quantity, inspectionStatus: 'ACCEPTED' } });
    batches.push(await prisma.inventoryBatch.create({ data: { itemId: item.id, locationId: location.id, sourcePhysicalDonationLineId: line.id, batchNumber: `GOODS-BATCH-${run}-${index}`, receivedQuantity: definition.quantity, availableQuantity: definition.quantity, status: 'AVAILABLE' } }));
  }
}, 60_000);

afterAll(async () => {
  const collections = await prisma.goodsCollection.findMany({ where: { studentId: { in: [student?.id, stableStudent?.id].filter(Boolean) } }, select: { id: true } });
  const collectionIds = collections.map(({ id }) => id);
  const requests = await prisma.confirmationRequest.findMany({ where: { targetType: 'GOODS_COLLECTION', targetId: { in: collectionIds } }, select: { id: true } });
  const requestIds = requests.map(({ id }) => id);
  await prisma.confirmationResponse.deleteMany({ where: { confirmationRequestId: { in: requestIds } } });
  await prisma.confirmationDelivery.deleteMany({ where: { confirmationRequestId: { in: requestIds } } });
  await prisma.confirmationRequest.deleteMany({ where: { id: { in: requestIds } } });
  await prisma.studentAssistanceHistory.deleteMany({ where: { reference: { startsWith: 'GOODS-' } } });
  const reservations = await prisma.inventoryReservation.findMany({ where: { targetType: 'GOODS_COLLECTION', targetId: { in: collectionIds } }, select: { id: true } });
  await prisma.goodsCollectionLine.deleteMany({ where: { collectionId: { in: collectionIds } } });
  await prisma.stockMovement.deleteMany({ where: { referenceType: 'GOODS_COLLECTION', referenceId: { in: collectionIds } } });
  await prisma.inventoryReservation.deleteMany({ where: { id: { in: reservations.map(({ id }) => id) } } });
  await prisma.goodsCollection.deleteMany({ where: { id: { in: collectionIds } } });
  const batchIds = batches.map(({ id }) => id);
  const itemIds = await prisma.inventoryBatch.findMany({ where: { id: { in: batchIds } }, select: { itemId: true } });
  await prisma.inventoryBatch.deleteMany({ where: { id: { in: batchIds } } });
  await prisma.inventoryItem.deleteMany({ where: { id: { in: itemIds.map(({ itemId }) => itemId) } } });
  await prisma.physicalDonationLine.deleteMany({ where: { physicalDonationId: physicalDonation?.id } });
  if (physicalDonation?.id) await prisma.physicalDonation.delete({ where: { id: physicalDonation.id } });
  if (location?.id) await prisma.inventoryLocation.delete({ where: { id: location.id } });
  const studentIds = [student?.id, stableStudent?.id].filter(Boolean);
  await prisma.studentAidRecord.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.studentFinancialRecord.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [clerk,releaser,studentUser,stableUser].filter(Boolean).map(({ id }) => id) } } });
}, 60_000);

describe('Section 20 physical-goods collections', () => {
  it('enforces clerk permission, objective need evidence and category quantity limits', async () => {
    await expect(service.create(noPermissions(), { registrationNumber: student.registrationNumber, lines: [{ batchId: batches[0].id, quantity: 1 }] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(service.create(clerkAuth(), { registrationNumber: stableStudent.registrationNumber, lines: [{ batchId: batches[0].id, quantity: 1 }] })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(service.create(clerkAuth(), { registrationNumber: student.registrationNumber, lines: [{ batchId: batches[0].id, quantity: 4 }] })).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);

  it('reserves stock and refuses handover before student confirmation', async () => {
    rejectedCollection = await service.create(clerkAuth(), { registrationNumber: student.registrationNumber, lines: [{ batchId: batches[0].id, quantity: 2 }, { batchId: batches[1].id, quantity: 3 }] });
    expect(rejectedCollection).toMatchObject({ status: 'PENDING_CONFIRMATION', registrationNumber: student.registrationNumber });
    expect(sent).toHaveLength(1);
    const stored = await prisma.inventoryBatch.findMany({ where: { id: { in: batches.map(({ id }) => id) } }, orderBy: { batchNumber: 'asc' } });
    expect(stored.map(({ reservedQuantity }) => reservedQuantity)).toEqual([2,3]);
    await expect(goodsReleaseService.release(releaserAuth(), rejectedCollection.id)).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);

  it('releases all reservations after NO and permits a corrected collection', async () => {
    const result = await confirmation.respond({ token: tokenFromLastSms(), decision: 'NO', ipAddress: '127.0.0.1', userAgent: 'vitest' });
    expect(result).toMatchObject({ status: 'REJECTED', collectionStatus: 'REJECTED' });
    expect((await service.get(clerkAuth(), rejectedCollection.id)).status).toBe('REJECTED');
    const restored = await prisma.inventoryBatch.findMany({ where: { id: { in: batches.map(({ id }) => id) } } });
    expect(restored.every(({ reservedQuantity, availableQuantity }) => reservedQuantity === 0 && availableQuantity === 20)).toBe(true);
    releasedCollection = await service.create(clerkAuth(), { registrationNumber: student.registrationNumber, lines: [{ batchId: batches[0].id, quantity: 3 }, { batchId: batches[1].id, quantity: 4 }] });
    expect(releasedCollection.status).toBe('PENDING_CONFIRMATION');
  }, 30_000);

  it('issues goods only after YES and records immutable inventory evidence', async () => {
    const token = tokenFromLastSms();
    expect(await confirmation.respond({ token, decision: 'YES', ipAddress: '127.0.0.1', userAgent: 'vitest' })).toMatchObject({ status: 'ACCEPTED', collectionStatus: 'CONFIRMED' });
    expect(await confirmation.respond({ token, decision: 'YES' })).toMatchObject({ alreadyProcessed: true, status: 'ACCEPTED' });
    const released = await goodsReleaseService.release(releaserAuth(), releasedCollection.id);
    expect(released.status).toBe('RELEASED');
    const stored = await prisma.inventoryBatch.findMany({ where: { id: { in: batches.map(({ id }) => id) } } });
    expect(stored.reduce((sum, item) => sum + item.issuedQuantity, 0)).toBe(7);
    expect(await prisma.stockMovement.count({ where: { referenceType: 'GOODS_COLLECTION', referenceId: releasedCollection.id, type: 'ISSUE' } })).toBe(2);
    expect(await prisma.studentAssistanceHistory.count({ where: { reference: releasedCollection.reference, assistanceType: 'GOODS' } })).toBe(1);
  }, 30_000);

  it('blocks repeat collection during the policy cooldown period', async () => {
    await expect(service.create(clerkAuth(), { registrationNumber: student.registrationNumber, lines: [{ batchId: batches[0].id, quantity: 1 }] })).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);
});
