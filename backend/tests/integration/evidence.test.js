import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { createEvidenceService } from '../../src/modules/evidence/evidence.service.js';

const run = Date.now();
const remote = new Map();
const cid = `bafy${'a'.repeat(56)}`;
const uploader = async (content) => {
  remote.set(cid, Buffer.from(content));
  return { cid, size: Buffer.byteLength(content) };
};
const retriever = async (requestedCid) => remote.get(requestedCid);
const service = createEvidenceService({ uploader, retriever });
let administrator;
let reader;
let donor;
let donation;
let evidence;
let originalRemote;

const administratorAuth = () => ({ user: administrator, permissions: [PERMISSIONS.SYSTEM_ADMINISTER] });
const readerAuth = () => ({ user: reader, permissions: [PERMISSIONS.EVIDENCE_READ] });

async function register(name) {
  return (await authService.register({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '-')}-${run}@example.test`,
    password: 'Section22-Strong-Password-42!'
  })).user;
}

beforeAll(async () => {
  [administrator, reader, donor] = await Promise.all([
    register('Evidence Administrator'), register('Evidence Reader'), register('Evidence Donor')
  ]);
  const profile = await prisma.donorProfile.findUniqueOrThrow({ where: { userId: donor.id } });
  donation = await prisma.moneyDonation.create({
    data: {
      donorProfileId: profile.id, amount: 2500, channel: 'MPESA_PAYBILL', status: 'CONFIRMED',
      trackingId: `EVIDENCE-${run}`, trackingSecretHash: `secret-${run}`,
      idempotencyKey: `evidence-${run}`, providerReceipt: `EVIDENCE-RECEIPT-${run}`,
      confirmedAt: new Date()
    }
  });
}, 60_000);

afterAll(async () => {
  await prisma.evidenceRecord.deleteMany({ where: { subjectType: 'DONATION', subjectId: donation?.id } });
  if (donation?.id) await prisma.moneyDonation.delete({ where: { id: donation.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [administrator, reader, donor].filter(Boolean).map(({ id }) => id) } }
  });
}, 60_000);

describe('Section 22 encrypted evidence and IPFS references', () => {
  it('enforces management permission, subject existence and evidence-type compatibility', async () => {
    const input = {
      subjectType: 'DONATION', subjectId: donation.id, evidenceType: 'DONATION_RECEIPT',
      sensitivity: 'RESTRICTED', retentionDays: 30, content: { amount: 2500, privateNote: 'protected' }
    };
    await expect(service.create({ user: reader, permissions: [] }, input)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(service.create(administratorAuth(), { ...input, evidenceType: 'VETTING_DECISION' }))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('canonicalizes, encrypts and stores only encrypted content in IPFS and PostgreSQL', async () => {
    evidence = await service.create(administratorAuth(), {
      subjectType: 'DONATION', subjectId: donation.id, evidenceType: 'DONATION_RECEIPT',
      sensitivity: 'RESTRICTED', retentionDays: 30,
      content: { privateNote: 'protected', amount: 2500, receipt: `EVIDENCE-RECEIPT-${run}` }
    });
    expect(evidence).toMatchObject({ subjectType: 'DONATION', evidenceType: 'DONATION_RECEIPT', ipfsCid: cid, status: 'ACTIVE' });
    const stored = await prisma.evidenceRecord.findUniqueOrThrow({ where: { id: evidence.id } });
    expect(stored.encryptedContent).not.toContain('protected');
    expect(remote.get(cid).toString('utf8')).not.toContain('protected');
    expect(stored.canonicalDigest).toMatch(/^[a-f0-9]{64}$/);
    originalRemote = Buffer.from(remote.get(cid));
  });

  it('permits governed decryption, metadata listing and end-to-end integrity verification', async () => {
    await expect(service.get({ user: reader, permissions: [] }, evidence.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const retrieved = await service.get(readerAuth(), evidence.id);
    expect(retrieved.content.content).toMatchObject({ amount: 2500, privateNote: 'protected' });
    expect(await service.list(readerAuth(), 'DONATION', donation.id)).toHaveLength(1);
    expect(await service.verify(readerAuth(), evidence.id)).toMatchObject({ verified: true, reason: null });
  });

  it('detects altered IPFS envelopes and records the integrity failure', async () => {
    const altered = JSON.parse(originalRemote.toString('utf8'));
    altered.ciphertext = `${altered.ciphertext.slice(0, -2)}AA`;
    remote.set(cid, Buffer.from(JSON.stringify(altered)));
    expect(await service.verify(readerAuth(), evidence.id)).toMatchObject({ verified: false });
    expect((await prisma.evidenceRecord.findUniqueOrThrow({ where: { id: evidence.id } })).status)
      .toBe('INTEGRITY_FAILED');
    remote.set(cid, originalRemote);
    expect(await service.verify(readerAuth(), evidence.id)).toMatchObject({ verified: true });
  });

  it('expires due evidence and cryptographically destroys content only after retention', async () => {
    await expect(service.destroy(administratorAuth(), evidence.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const overdue = new Date(Date.now() - 1);
    await prisma.evidenceRecord.update({ where: { id: evidence.id }, data: { retainedUntil: overdue } });
    expect(await service.expireDue(administratorAuth())).toMatchObject({ count: 1 });
    expect((await service.destroy(administratorAuth(), evidence.id)).status).toBe('DESTROYED');
    const stored = await prisma.evidenceRecord.findUniqueOrThrow({ where: { id: evidence.id } });
    expect(stored.encryptedContent).toBe('');
    expect((await service.get(readerAuth(), evidence.id)).content).toBeNull();
  });
});
