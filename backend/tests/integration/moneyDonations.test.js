import { prisma } from '@charitychain/database';
import { afterAll, describe, expect, it } from 'vitest';
import { authService } from '../../src/modules/auth/auth.service.js';
import { donationAllocationService } from '../../src/modules/moneyDonations/donationAllocation.service.js';
import { moneyDonationsService } from '../../src/modules/moneyDonations/moneyDonations.service.js';

const email = `section9-${Date.now()}@example.test`;
const password = 'Section9-Strong-Password-42!';
let user;
let donor;
let donationId;
let trackingId;
let trackingSecret;
const auth = () => ({ user, session: { id: 'section9-test-session' }, permissions: [] });

afterAll(async () => {
  if (!user?.id) return;
  const donations = await prisma.moneyDonation.findMany({
    where: { donorProfile: { userId: user.id } },
    select: { id: true }
  });
  const ids = donations.map(({ id }) => id);
  if (ids.length) {
    await prisma.donationReceipt.deleteMany({ where: { donationId: { in: ids } } });
    await prisma.donationAllocation.deleteMany({ where: { donationId: { in: ids } } });
    await prisma.moneyDonation.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.user.deleteMany({ where: { id: user.id } });
});

describe('Section 9 monetary donations', () => {
  it('creates a donation idempotently and never persists the tracking secret', async () => {
    const registration = await authService.register({ name: 'Section Nine Donor', email, password });
    user = registration.user;
    donor = await prisma.donorProfile.findUniqueOrThrow({ where: { userId: user.id } });

    const input = { amount: '30000.00', channel: 'MPESA_STK', purpose: 'UNRESTRICTED' };
    const first = await moneyDonationsService.create(auth(), input, 'section9-create-1');
    const replay = await moneyDonationsService.create(auth(), input, 'section9-create-1');
    donationId = first.donation.id;
    trackingId = first.donation.trackingId;
    trackingSecret = first.verificationSecret;

    expect(replay).toEqual(first);
    expect(await prisma.moneyDonation.count({ where: { donorProfileId: donor.id } })).toBe(1);
    const stored = await prisma.moneyDonation.findUniqueOrThrow({ where: { id: donationId } });
    expect(stored.trackingSecretHash).not.toBe(trackingSecret);
    expect(stored.trackingSecretHash).toMatch(/^[a-f0-9]{64}$/);
  }, 30_000);

  it('requires the tracking secret and exposes only privacy-safe public fields', async () => {
    await expect(moneyDonationsService.track(trackingId, 'wrong-secret')).rejects.toMatchObject({
      code: 'DONATION_NOT_FOUND'
    });
    const tracked = await moneyDonationsService.track(trackingId, trackingSecret);
    expect(tracked).toMatchObject({ trackingId, amount: '30000', status: 'CREATED' });
    expect(tracked).not.toHaveProperty('providerReference');
    expect(tracked).not.toHaveProperty('providerReceipt');
    expect(tracked).not.toHaveProperty('donorProfile');
  });

  it('enforces payment states and reconciles exactly once across retries', async () => {
    await expect(moneyDonationsService.reconcile(donationId)).rejects.toMatchObject({
      code: 'DONATION_STATE_CONFLICT'
    });
    await moneyDonationsService.requestPayment(donationId, 'checkout-section9-1');
    await moneyDonationsService.markProviderPending(donationId);
    await expect(
      moneyDonationsService.confirm(donationId, {
        amount: '29999.00',
        providerReceipt: 'MPESA-WRONG-AMOUNT'
      })
    ).rejects.toMatchObject({ code: 'DONATION_STATE_CONFLICT' });
    await moneyDonationsService.confirm(donationId, {
      amount: '30000.00',
      providerReceipt: 'MPESA-SECTION9-1',
      confirmedAt: new Date('2026-11-08T12:00:00.000Z')
    });

    const first = await moneyDonationsService.reconcile(donationId);
    const replay = await moneyDonationsService.reconcile(donationId);
    expect(first.status).toBe('RECONCILED');
    expect(replay.status).toBe('RECONCILED');
    expect(first.receipt.evidenceDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(await prisma.donationAllocation.count({ where: { donationId } })).toBe(1);
    expect(await prisma.donationReceipt.count({ where: { donationId } })).toBe(1);
    expect(
      await prisma.recognizedContribution.count({
        where: { sourceType: 'MONEY', sourceId: donationId }
      })
    ).toBe(1);
    const updatedDonor = await prisma.donorProfile.findUniqueOrThrow({ where: { id: donor.id } });
    expect(updatedDonor.moneyContribution.toString()).toBe('30000');
  }, 30_000);

  it('prevents over-allocation and reverses all financial effects idempotently', async () => {
    const reconciled = await prisma.moneyDonation.findUniqueOrThrow({
      where: { id: donationId },
      include: { donorProfile: true, allocations: true, receipt: true }
    });
    await expect(
      donationAllocationService.allocate(reconciled, {
        allocationType: 'STUDENT_APPLICATION',
        targetReference: 'APPLICATION-OVERFLOW',
        amount: '1.00'
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    await moneyDonationsService.reverse(donationId);
    const replay = await moneyDonationsService.reverse(donationId);
    expect(replay.status).toBe('REVERSED');
    expect(
      await prisma.donationAllocation.count({ where: { donationId, status: 'REVERSED' } })
    ).toBe(1);
    const receipt = await prisma.donationReceipt.findUniqueOrThrow({ where: { donationId } });
    expect(receipt.voidedAt).toBeInstanceOf(Date);
    expect(
      await prisma.recognizedContribution.count({
        where: { sourceType: 'MONEY', sourceId: donationId }
      })
    ).toBe(0);
    const updatedDonor = await prisma.donorProfile.findUniqueOrThrow({ where: { id: donor.id } });
    expect(updatedDonor.moneyContribution.toString()).toBe('0');
  }, 30_000);
});
