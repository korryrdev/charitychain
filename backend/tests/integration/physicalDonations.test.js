import { prisma } from '@charitychain/database';
import { afterAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { physicalCashDepositService } from '../../src/modules/physicalDonations/physicalCashDeposit.service.js';
import { physicalDonationInspectionService } from '../../src/modules/physicalDonations/physicalDonationInspection.service.js';
import { physicalDonationsService } from '../../src/modules/physicalDonations/physicalDonations.service.js';

const run = Date.now();
let clerk;
let inspector;
let donor;
let goodsDonation;
const clerkAuth = () => ({ user: clerk, permissions: [PERMISSIONS.PHYSICAL_DONATION_RECORD] });
const inspectorAuth = () => ({ user: inspector, permissions: [PERMISSIONS.PHYSICAL_DONATION_INSPECT] });

afterAll(async () => {
  const userIds = [clerk?.id, inspector?.id, donor?.id].filter(Boolean);
  const physical = await prisma.physicalDonation.findMany({ where: { clerkUserId: { in: userIds } }, select: { id: true } });
  const ids = physical.map(({ id }) => id);
  await prisma.physicalCashDeposit.deleteMany({ where: { physicalDonationId: { in: ids } } });
  await prisma.physicalDonationInspection.deleteMany({ where: { physicalDonationId: { in: ids } } });
  await prisma.physicalDonationLine.deleteMany({ where: { physicalDonationId: { in: ids } } });
  await prisma.physicalDonation.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe('Section 11 physical donations', () => {
  it('stages and locks clerk-recorded goods without exposing donor contact data', async () => {
    clerk = (await authService.register({ name: 'Physical Clerk', email: `clerk-${run}@example.test`, password: 'Section11-Strong-Password-42!' })).user;
    inspector = (await authService.register({ name: 'Goods Inspector', email: `inspector-${run}@example.test`, password: 'Section11-Strong-Password-42!' })).user;
    donor = (await authService.register({ name: 'Goods Donor', email: `donor-${run}@example.test`, password: 'Section11-Strong-Password-42!' })).user;
    const profile = await prisma.donorProfile.findUniqueOrThrow({ where: { userId: donor.id } });
    goodsDonation = await physicalDonationsService.create(clerkAuth(), { donorName: 'Goods Donor', donorPhone: '254712345678', donorProfileId: profile.id, kind: 'GOODS', lines: [{ lineType: 'GOODS', itemName: 'Bathing soap', category: 'Hygiene', quantity: 10, unit: 'bars' }] });
    expect(goodsDonation).toMatchObject({ status: 'DRAFT', donorPhone: '*******5678' });
    const stored = await prisma.physicalDonation.findUniqueOrThrow({ where: { id: goodsDonation.id } });
    expect(stored.donorPhoneEncrypted).not.toContain('254712345678');
    expect(stored.donorPhoneHash).toMatch(/^[a-f0-9]{64}$/);
    goodsDonation = await physicalDonationsService.submit(clerkAuth(), goodsDonation.id);
    expect(goodsDonation.status).toBe('AWAITING_DONOR_CONFIRMATION');
    await expect(physicalDonationsService.submit(clerkAuth(), goodsDonation.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await prisma.recognizedContribution.count({ where: { sourceType: 'GOODS', sourceId: goodsDonation.id } })).toBe(0);
  }, 30_000);

  it('provides the exact confirmation snapshot and blocks inspection before consent', async () => {
    const target = await physicalDonationsService.confirmationTarget(goodsDonation.id);
    expect(target).toMatchObject({ phoneNumber: '254712345678', donorName: 'Goods Donor', version: 1 });
    expect(target.lines).toEqual([{ itemName: 'Bathing soap', quantity: 10, unit: 'bars', declaredValue: null }]);
    await expect(physicalDonationInspectionService.inspect(inspectorAuth(), goodsDonation.id, { decision: 'ACCEPTED', lines: [{ lineId: goodsDonation.lines[0].id, acceptedQuantity: 10, approvedUnitValue: 80 }] })).rejects.toMatchObject({ code: 'CONFLICT' });
    goodsDonation = await physicalDonationsService.recordDonorDecision(goodsDonation.id, true);
    expect(goodsDonation.status).toBe('CONFIRMED');
  });

  it('enforces independent inspection and recognizes only approved goods value', async () => {
    await expect(physicalDonationInspectionService.inspect(clerkAuth(), goodsDonation.id, { decision: 'ACCEPTED', lines: [{ lineId: goodsDonation.lines[0].id, acceptedQuantity: 10, approvedUnitValue: 80 }] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const inspected = await physicalDonationInspectionService.inspect(inspectorAuth(), goodsDonation.id, { decision: 'PARTIALLY_ACCEPTED', notes: 'Two bars damaged', lines: [{ lineId: goodsDonation.lines[0].id, acceptedQuantity: 8, approvedUnitValue: 80, rejectionReason: 'Two damaged' }] });
    expect(inspected).toMatchObject({ status: 'ACCEPTED' });
    expect(inspected.lines[0]).toMatchObject({ acceptedQuantity: 8, approvedUnitValue: '80', inspectionStatus: 'PARTIALLY_ACCEPTED' });
    const recognition = await prisma.recognizedContribution.findUniqueOrThrow({ where: { sourceType_sourceId: { sourceType: 'GOODS', sourceId: goodsDonation.id } } });
    expect(recognition.value.toString()).toBe('640');
    await expect(physicalDonationInspectionService.inspect(inspectorAuth(), goodsDonation.id, { decision: 'ACCEPTED', lines: [{ lineId: goodsDonation.lines[0].id, acceptedQuantity: 10, approvedUnitValue: 80 }] })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('keeps donor-rejected goods out of inspection and recognition', async () => {
    let rejected = await physicalDonationsService.create(clerkAuth(), { donorName: 'Walk-in Donor', donorPhone: '254733445566', kind: 'GOODS', lines: [{ lineType: 'GOODS', itemName: 'Toothpaste', quantity: 4, unit: 'tubes' }] });
    rejected = await physicalDonationsService.submit(clerkAuth(), rejected.id);
    rejected = await physicalDonationsService.recordDonorDecision(rejected.id, false);
    expect(rejected.status).toBe('REJECTED');
    await expect(physicalDonationsService.confirmationTarget(rejected.id)).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('requires an exact, idempotent cash deposit before matching physical cash', async () => {
    let cash = await physicalDonationsService.create(clerkAuth(), { donorName: 'Cash Donor', donorPhone: '254700111222', kind: 'CASH', lines: [{ lineType: 'CASH', itemName: 'Cash contribution', quantity: 1, unit: 'deposit', declaredValue: 5000 }] });
    cash = await physicalDonationsService.submit(clerkAuth(), cash.id);
    cash = await physicalDonationsService.recordDonorDecision(cash.id, true);
    expect(cash.status).toBe('DEPOSIT_PENDING');
    await expect(physicalCashDepositService.record(cash.id, { amount: 4999, depositReference: 'DEP-SECTION11-1' })).rejects.toMatchObject({ code: 'CONFLICT' });
    const deposit = await physicalCashDepositService.record(cash.id, { amount: 5000, depositReference: 'DEP-SECTION11-1' });
    const replay = await physicalCashDepositService.record(cash.id, { amount: 5000, depositReference: 'DEP-SECTION11-1' });
    expect(replay.id).toBe(deposit.id);
    await physicalCashDepositService.match('DEP-SECTION11-1');
    await physicalCashDepositService.match('DEP-SECTION11-1');
    expect((await prisma.physicalDonation.findUniqueOrThrow({ where: { id: cash.id } })).status).toBe('DEPOSIT_MATCHED');
  }, 30_000);
});
