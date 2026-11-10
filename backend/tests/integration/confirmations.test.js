import { prisma } from '@charitychain/database';
import { afterAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { createConfirmationsService } from '../../src/modules/confirmations/confirmations.service.js';
import { hashConfirmationToken } from '../../src/modules/confirmations/confirmationToken.service.js';
import { physicalDonationsService } from '../../src/modules/physicalDonations/physicalDonations.service.js';

const sentMessages = [];
const sms = { name: 'test-sms', async send(payload) { sentMessages.push(payload); return { providerMessageId: `MSG-${sentMessages.length}` }; } };
const service = createConfirmationsService({ smsProvider: sms, ttlMinutes: 15 });
const run = Date.now();
let clerk;
let firstDonation;
const auth = () => ({ user: clerk, permissions: [PERMISSIONS.PHYSICAL_DONATION_RECORD, PERMISSIONS.CONFIRMATION_MANAGE] });
const extractToken = (message) => decodeURIComponent(message.match(/[?&]token=([^\s]+)/)[1]);

async function stagedDonation(name, phone = '254712345678') {
  let donation = await physicalDonationsService.create(auth(), { donorName: name, donorPhone: phone, kind: 'GOODS', lines: [{ lineType: 'GOODS', itemName: 'Sanitary pads', quantity: 3, unit: 'packs' }] });
  return physicalDonationsService.submit(auth(), donation.id);
}

afterAll(async () => {
  if (!clerk?.id) return;
  const donations = await prisma.physicalDonation.findMany({ where: { clerkUserId: clerk.id }, select: { id: true } });
  const ids = donations.map(({ id }) => id);
  const requests = await prisma.confirmationRequest.findMany({ where: { physicalDonationId: { in: ids } }, select: { id: true } });
  const requestIds = requests.map(({ id }) => id);
  await prisma.confirmationResponse.deleteMany({ where: { confirmationRequestId: { in: requestIds } } });
  await prisma.confirmationDelivery.deleteMany({ where: { confirmationRequestId: { in: requestIds } } });
  await prisma.confirmationRequest.deleteMany({ where: { id: { in: requestIds } } });
  await prisma.physicalDonationLine.deleteMany({ where: { physicalDonationId: { in: ids } } });
  await prisma.physicalDonation.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: clerk.id } });
});

describe('Section 12 confirmations and SMS delivery', () => {
  it('sends a privacy-safe single-use confirmation without storing its raw token', async () => {
    clerk = (await authService.register({ name: 'Confirmation Clerk', email: `confirm-${run}@example.test`, password: 'Section12-Strong-Password-42!' })).user;
    firstDonation = await stagedDonation('Walk-in Donor');
    const confirmation = await service.issueForPhysicalDonation(auth(), firstDonation.id);
    const token = extractToken(sentMessages.at(-1).message);
    const stored = await prisma.confirmationRequest.findUniqueOrThrow({ where: { id: confirmation.id } });
    expect(confirmation).toMatchObject({ status: 'PENDING', targetType: 'PHYSICAL_DONATION' });
    expect(sentMessages.at(-1).to).toBe('254712345678');
    expect(sentMessages.at(-1).message).toContain('3 packs Sanitary pads');
    expect(stored.tokenHash).toBe(hashConfirmationToken(token));
    expect(JSON.stringify(stored)).not.toContain(token);
    const delivery = await prisma.confirmationDelivery.findFirstOrThrow({ where: { confirmationRequestId: confirmation.id } });
    expect(delivery).toMatchObject({ status: 'SENT', provider: 'test-sms' });
    expect(delivery.recipientHash).toMatch(/^[a-f0-9]{64}$/);
  }, 30_000);

  it('supersedes stale requests and accepts exactly one YES response', async () => {
    const staleToken = extractToken(sentMessages.at(-1).message);
    const fresh = await service.issueForPhysicalDonation(auth(), firstDonation.id);
    const freshToken = extractToken(sentMessages.at(-1).message);
    await expect(service.respond({ token: staleToken, decision: 'YES', ipAddress: '127.0.0.1', userAgent: 'test-agent' })).rejects.toMatchObject({ code: 'CONFIRMATION_INVALID' });
    const result = await service.respond({ token: freshToken, decision: 'YES', ipAddress: '127.0.0.1', userAgent: 'test-agent' });
    expect(result).toEqual({ accepted: true, alreadyProcessed: false, status: 'ACCEPTED' });
    expect(await service.respond({ token: freshToken, decision: 'YES' })).toEqual({ accepted: true, alreadyProcessed: true, status: 'ACCEPTED' });
    expect((await prisma.physicalDonation.findUniqueOrThrow({ where: { id: firstDonation.id } })).status).toBe('CONFIRMED');
    const response = await prisma.confirmationResponse.findUniqueOrThrow({ where: { confirmationRequestId: fresh.id } });
    expect(response).toMatchObject({ decision: 'YES' });
    expect(response.sourceIpHash).toMatch(/^[a-f0-9]{64}$/);
    expect(response.userAgentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('records NO and keeps the rejected intake outside finalized flows', async () => {
    const donation = await stagedDonation('Rejecting Donor', '254733445566');
    await service.issueForPhysicalDonation(auth(), donation.id);
    const token = extractToken(sentMessages.at(-1).message);
    expect(await service.respond({ token, decision: 'NO' })).toMatchObject({ status: 'REJECTED' });
    expect((await prisma.physicalDonation.findUniqueOrThrow({ where: { id: donation.id } })).status).toBe('REJECTED');
  }, 30_000);

  it('expires overdue tokens without changing the target donation', async () => {
    const donation = await stagedDonation('Late Donor', '254700111222');
    const confirmation = await service.issueForPhysicalDonation(auth(), donation.id);
    const token = extractToken(sentMessages.at(-1).message);
    await prisma.confirmationRequest.update({ where: { id: confirmation.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(service.respond({ token, decision: 'YES' })).rejects.toMatchObject({ code: 'CONFIRMATION_EXPIRED' });
    expect((await prisma.confirmationRequest.findUniqueOrThrow({ where: { id: confirmation.id } })).status).toBe('EXPIRED');
    expect((await prisma.physicalDonation.findUniqueOrThrow({ where: { id: donation.id } })).status).toBe('AWAITING_DONOR_CONFIRMATION');
  }, 30_000);

  it('records SMS delivery failure and leaves the donation awaiting a fresh request', async () => {
    const donation = await stagedDonation('Delivery Failure Donor', '254722333444');
    const failing = createConfirmationsService({ smsProvider: { name: 'failing-sms', async send() { throw new Error('Provider unavailable'); } } });
    await expect(failing.issueForPhysicalDonation(auth(), donation.id)).rejects.toThrow('Provider unavailable');
    const request = await prisma.confirmationRequest.findFirstOrThrow({ where: { physicalDonationId: donation.id }, orderBy: { createdAt: 'desc' }, include: { deliveries: true } });
    expect(request.status).toBe('DELIVERY_FAILED');
    expect(request.deliveries[0]).toMatchObject({ status: 'FAILED', failureReason: 'Provider unavailable' });
    expect((await prisma.physicalDonation.findUniqueOrThrow({ where: { id: donation.id } })).status).toBe('AWAITING_DONOR_CONFIRMATION');
  }, 30_000);
});
