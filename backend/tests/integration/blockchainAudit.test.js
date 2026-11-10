import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { createAnchorQueueService } from '../../src/modules/blockchainAudit/anchorQueue.service.js';
import { createBlockchainAuditService } from '../../src/modules/blockchainAudit/blockchainAudit.service.js';
import { blockchainAuditRepository } from '../../src/modules/blockchainAudit/blockchainAudit.repository.js';
import { createTransactionMonitorService } from '../../src/modules/blockchainAudit/transactionMonitor.service.js';

const run = Date.now();
let administrator;
let reader;
let donor;
let donation;
let evidence;
let failedEvidence;
let anchor;
let monitorState = 'PENDING';
let shouldFail = false;

const gateway = {
  async submit(value) {
    if (shouldFail) throw new Error('simulated RPC outage');
    return { transactionHash: `0x${value.commitment.slice(2)}`, blockNumber: 100, contractAddress: '0x0000000000000000000000000000000000000001' };
  },
  async inspect() {
    return monitorState === 'CONFIRMED'
      ? { state: 'CONFIRMED', confirmations: 2, blockNumber: 100 }
      : { state: 'PENDING', confirmations: 1, blockNumber: 100 };
  }
};
const queue = createAnchorQueueService({ repository: blockchainAuditRepository, gatewayFactory: () => gateway });
const monitor = createTransactionMonitorService({ repository: blockchainAuditRepository, gatewayFactory: () => gateway });
const service = createBlockchainAuditService({ repository: blockchainAuditRepository, queue, monitor, network: 'testnet', requiredConfirmations: 2 });
const administratorAuth = () => ({ user: administrator, permissions: [PERMISSIONS.SYSTEM_ADMINISTER] });
const readerAuth = () => ({ user: reader, permissions: [PERMISSIONS.AUDIT_READ] });

async function register(name) {
  return (await authService.register({ name, email: `${name.toLowerCase().replaceAll(' ', '-')}-${run}@example.test`, password: 'Section23-Strong-Password-42!' })).user;
}

async function createEvidence(suffix, version) {
  return prisma.evidenceRecord.create({ data: {
    reference: `ANCHOR-EVIDENCE-${run}-${suffix}`, subjectType: 'DONATION', subjectId: donation.id,
    evidenceType: 'DONATION_RECEIPT', version, canonicalDigest: `${suffix}`.padEnd(64, 'a').slice(0, 64),
    encryptedContent: 'ciphertext', encryptionIv: 'iv', encryptionAuthTag: 'tag',
    ipfsCid: `bafy${'a'.repeat(50)}${suffix.toLowerCase().padEnd(6, 'a').slice(0, 6)}`,
    retainedUntil: new Date(Date.now() + 86_400_000), createdByUserId: administrator.id
  } });
}

beforeAll(async () => {
  [administrator, reader, donor] = await Promise.all([register('Anchor Administrator'), register('Anchor Reader'), register('Anchor Donor')]);
  const profile = await prisma.donorProfile.findUniqueOrThrow({ where: { userId: donor.id } });
  donation = await prisma.moneyDonation.create({ data: { donorProfileId: profile.id, amount: 1300, channel: 'MPESA_PAYBILL', status: 'CONFIRMED', trackingId: `ANCHOR-${run}`, trackingSecretHash: `secret-${run}`, idempotencyKey: `anchor-${run}`, providerReceipt: `ANCHOR-RECEIPT-${run}`, confirmedAt: new Date() } });
  [evidence, failedEvidence] = await Promise.all([createEvidence('FIRST', 1), createEvidence('SECOND', 2)]);
}, 60_000);

afterAll(async () => {
  const anchors = await prisma.blockchainAnchor.findMany({ where: { evidenceId: { in: [evidence?.id, failedEvidence?.id].filter(Boolean) } }, select: { id: true } });
  await prisma.blockchainAnchorAttempt.deleteMany({ where: { anchorId: { in: anchors.map(({ id }) => id) } } });
  await prisma.blockchainAnchor.deleteMany({ where: { id: { in: anchors.map(({ id }) => id) } } });
  await prisma.evidenceRecord.deleteMany({ where: { id: { in: [evidence?.id, failedEvidence?.id].filter(Boolean) } } });
  if (donation?.id) await prisma.moneyDonation.delete({ where: { id: donation.id } });
  await prisma.user.deleteMany({ where: { id: { in: [administrator, reader, donor].filter(Boolean).map(({ id }) => id) } } });
}, 60_000);

describe('Section 23 blockchain audit anchoring', () => {
  it('allows only administrators to queue anchors and creates privacy-safe commitments idempotently', async () => {
    await expect(service.queue({ user: reader, permissions: [] }, evidence.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    anchor = await service.queue(administratorAuth(), evidence.id);
    expect(anchor).toMatchObject({ status: 'QUEUED', network: 'testnet', confirmations: 0 });
    expect(anchor.commitment).toMatch(/^0x[a-f0-9]{64}$/);
    expect(anchor.subjectKey).toMatch(/^0x[a-f0-9]{64}$/);
    expect(JSON.stringify(anchor)).not.toContain(donation.id);
    expect((await service.queue(administratorAuth(), evidence.id)).id).toBe(anchor.id);
  });

  it('submits once, records an append-only attempt and tracks confirmations without wallets or payments', async () => {
    await expect(service.get({ user: reader, permissions: [] }, anchor.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const submitted = await service.submit(administratorAuth(), anchor.id);
    expect(submitted).toMatchObject({ status: 'SUBMITTED', attemptCount: 1, blockNumber: '100' });
    expect(submitted.transactionHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(await service.monitor(administratorAuth(), anchor.id)).toMatchObject({ status: 'SUBMITTED', confirmations: 1 });
    monitorState = 'CONFIRMED';
    expect(await service.monitor(administratorAuth(), anchor.id)).toMatchObject({ status: 'CONFIRMED', confirmations: 2 });
    expect(await service.get(readerAuth(), anchor.id)).toMatchObject({ status: 'CONFIRMED' });
  });

  it('records RPC submission failure rather than claiming an anchor was committed', async () => {
    const failedAnchor = await service.queue(administratorAuth(), failedEvidence.id);
    shouldFail = true;
    await expect(service.submit(administratorAuth(), failedAnchor.id)).rejects.toMatchObject({ code: 'INTEGRATION_UNAVAILABLE' });
    shouldFail = false;
    expect(await service.get(readerAuth(), failedAnchor.id)).toMatchObject({ status: 'FAILED', attemptCount: 1 });
  });
});
