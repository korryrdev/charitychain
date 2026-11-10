import { prisma } from '@charitychain/database';
import { afterAll, describe, expect, it } from 'vitest';
import { authService } from '../../src/modules/auth/auth.service.js';
import { donorsService } from '../../src/modules/donors/donors.service.js';
import { publicProfilesService } from '../../src/modules/publicProfiles/publicProfiles.service.js';
import { recognitionService } from '../../src/modules/recognition/recognition.service.js';

const email = `section8-${Date.now()}@example.test`;
const password = 'Section8-Strong-Password-42!';
let user;
let donor;
const auth = () => ({ user, session: { id: 'test-session' }, permissions: [] });

afterAll(async () => {
  if (user?.id) await prisma.user.deleteMany({ where: { id: user.id } });
});

describe('Section 8 donor identity, public profile, and recognition', () => {
  it('creates a unique anonymous alias during account registration', async () => {
    const registration = await authService.register({
      name: 'Private Donor Name',
      email,
      password
    });
    user = registration.user;
    donor = await donorsService.getMine(auth());

    expect(donor.publicAlias).toMatch(/^[A-Za-z]+-[A-Za-z]+-\d{4}$/);
    expect(donor.displayNameMode).toBe('ALIAS');
    expect(donor.publicListed).toBe(true);
    expect(donor.showContributionTotal).toBe(false);
    expect(
      await prisma.donorProfile.count({
        where: { normalizedAlias: donor.publicAlias.toLowerCase() }
      })
    ).toBe(1);
  }, 30_000);

  it('keeps the generated alias public until an edited alias passes moderation', async () => {
    const originalAlias = donor.publicAlias;
    const requested = await donorsService.requestAlias(auth(), 'Helping Heart 77');
    expect(requested).toMatchObject({
      publicAlias: originalAlias,
      pendingAlias: 'Helping Heart 77',
      aliasReviewStatus: 'PENDING_REVIEW'
    });
    expect((await publicProfilesService.getPublic(donor.id)).displayName).toBe(originalAlias);

    donor = await donorsService.decideAlias(donor.id, true);
    expect(donor).toMatchObject({
      publicAlias: 'Helping Heart 77',
      pendingAlias: null,
      aliasReviewStatus: 'APPROVED'
    });
  });

  it('shows the alias by default and reveals real name only after explicit consent', async () => {
    const hiddenByDefault = await publicProfilesService.getPublic(donor.id);
    expect(hiddenByDefault.displayName).toBe('Helping Heart 77');
    expect(hiddenByDefault).not.toHaveProperty('totalContribution');
    expect(hiddenByDefault).toHaveProperty('recognitionTier');

    await publicProfilesService.updateMine(auth(), {
      displayNameMode: 'REAL_NAME',
      showContributionTotal: true
    });
    const consented = await publicProfilesService.getPublic(donor.id);
    expect(consented.displayName).toBe('Private Donor Name');
    expect(consented.totalContribution).toBe('0');
    expect(consented).not.toHaveProperty('email');
    expect(consented).not.toHaveProperty('userId');
  });

  it('calculates money and approved-goods recognition without double counting sources', async () => {
    await recognitionService.recordMoney(user.id, 'money-payment-1', '10000.00');
    await recognitionService.recordMoney(user.id, 'money-payment-1', '10000.00');
    await recognitionService.recordGoods(user.id, 'goods-receipt-1', [
      { approvedRate: '100.00', quantity: 200 }
    ]);

    const status = await recognitionService.mine(auth());
    expect(status).toMatchObject({
      moneyContribution: '10000',
      goodsContribution: '20000',
      totalContribution: '30000',
      recognitionTier: 'GOLD'
    });
    expect(await prisma.recognizedContribution.count({ where: { donorProfileId: donor.id } })).toBe(
      2
    );
    const history = await prisma.recognitionHistory.findMany({
      where: { donorProfileId: donor.id },
      orderBy: { createdAt: 'asc' }
    });
    expect(history.map((entry) => entry.toTier)).toEqual(['SILVER', 'GOLD']);
  });

  it('fails closed for unapproved goods values and hides donors who opt out', async () => {
    await expect(
      recognitionService.recordGoods(user.id, 'goods-invalid-1', [
        { approvedRate: null, quantity: 2 }
      ])
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    await publicProfilesService.updateMine(auth(), { publicListed: false });
    await expect(publicProfilesService.getPublic(donor.id)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND'
    });
    const listing = await publicProfilesService.list({ page: 1, pageSize: 25 });
    expect(listing.items.some((item) => item.id === donor.id)).toBe(false);
  });
});
