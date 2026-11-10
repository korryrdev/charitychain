import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { reconciliationService } from '../../src/modules/reconciliation/reconciliation.service.js';
import { matchTransaction } from '../../src/modules/reconciliation/transactionMatcher.service.js';

const run = Date.now();
const donationIds = [];
let operator;
let donor;
let periodStart;
let periodEnd;
let firstRun;

const operatorAuth = () => ({
  user: operator,
  permissions: [PERMISSIONS.RECONCILIATION_EXECUTE, PERMISSIONS.RECONCILIATION_READ]
});

async function register(name) {
  return (await authService.register({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '-')}-${run}@example.test`,
    password: 'Section21-Strong-Password-42!'
  })).user;
}

async function createDonation({ suffix, amount, providerAmount = amount, includeEvent = true }) {
  const profile = await prisma.donorProfile.findUniqueOrThrow({ where: { userId: donor.id } });
  const confirmedAt = new Date(Date.now() - 60_000);
  const donation = await prisma.moneyDonation.create({
    data: {
      donorProfileId: profile.id,
      amount,
      channel: 'MPESA_STK',
      status: 'CONFIRMED',
      trackingId: `REC-${run}-${suffix}`,
      trackingSecretHash: `secret-${run}-${suffix}`,
      idempotencyKey: `reconciliation-${run}-${suffix}`,
      providerReceipt: `RECEIPT-${run}-${suffix}`,
      confirmedAt
    }
  });
  donationIds.push(donation.id);
  const attempt = await prisma.paymentAttempt.create({
    data: {
      donationId: donation.id,
      provider: 'MPESA',
      flow: 'STK_PUSH',
      status: 'SUCCEEDED',
      amount: providerAmount,
      idempotencyKey: `attempt-${run}-${suffix}`,
      requestPayloadDigest: `digest-${run}-${suffix}`,
      providerRequestId: `REQUEST-${run}-${suffix}`,
      providerTransactionId: `TRANSACTION-${run}-${suffix}`,
      submittedAt: confirmedAt,
      completedAt: confirmedAt
    }
  });
  if (includeEvent) {
    await prisma.paymentProviderEvent.create({
      data: {
        paymentAttemptId: attempt.id,
        provider: 'MPESA',
        providerEventId: `EVENT-${run}-${suffix}`,
        eventType: 'PAYMENT_COMPLETED',
        payloadDigest: `event-digest-${run}-${suffix}`,
        processingStatus: 'PROCESSED',
        resultCode: '0',
        processedAt: confirmedAt
      }
    });
  }
  return donation;
}

beforeAll(async () => {
  [operator, donor] = await Promise.all([register('Reconciliation Operator'), register('Reconciliation Donor')]);
  periodStart = new Date(Date.now() - 3_600_000);
  await createDonation({ suffix: 'MATCH', amount: 1000 });
  await createDonation({ suffix: 'MISMATCH', amount: 2000, providerAmount: 1900 });
  await createDonation({ suffix: 'MISSING-EVENT', amount: 500, includeEvent: false });
  periodEnd = new Date();
}, 60_000);

afterAll(async () => {
  const runs = await prisma.reconciliationRun.findMany({
    where: { startedByUserId: operator?.id },
    select: { id: true }
  });
  const runIds = runs.map(({ id }) => id);
  await prisma.reconciliationItem.deleteMany({ where: { runId: { in: runIds } } });
  await prisma.reconciliationRun.deleteMany({ where: { id: { in: runIds } } });
  const journals = await prisma.ledgerJournal.findMany({
    where: { sourceType: 'DONATION', sourceId: { in: donationIds } },
    select: { id: true }
  });
  await prisma.ledgerEntry.deleteMany({ where: { journalId: { in: journals.map(({ id }) => id) } } });
  await prisma.ledgerJournal.deleteMany({ where: { id: { in: journals.map(({ id }) => id) } } });
  const attempts = await prisma.paymentAttempt.findMany({
    where: { donationId: { in: donationIds } },
    select: { id: true }
  });
  await prisma.paymentProviderEvent.deleteMany({ where: { paymentAttemptId: { in: attempts.map(({ id }) => id) } } });
  await prisma.paymentAttempt.deleteMany({ where: { id: { in: attempts.map(({ id }) => id) } } });
  await prisma.moneyDonation.deleteMany({ where: { id: { in: donationIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [operator, donor].filter(Boolean).map(({ id }) => id) } } });
}, 60_000);

describe('Section 21 reconciliation and ledger posting', () => {
  it('requires explicit reconciliation permission', async () => {
    await expect(reconciliationService.execute({ user: operator, permissions: [] }, {
      scope: 'DONATIONS', periodStart, periodEnd
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('matches provider evidence, preserves exceptions and posts only balanced journals', async () => {
    firstRun = await reconciliationService.execute(operatorAuth(), {
      scope: 'DONATIONS', periodStart, periodEnd
    });
    expect(firstRun).toMatchObject({ status: 'COMPLETED_WITH_EXCEPTIONS', matchedCount: 1, exceptionCount: 2 });
    expect(firstRun.items.map(({ outcome }) => outcome).sort()).toEqual([
      'AMOUNT_MISMATCH', 'MATCHED', 'MISSING_PROVIDER_EVENT'
    ]);
    const journals = await prisma.ledgerJournal.findMany({
      where: { sourceType: 'DONATION', sourceId: { in: donationIds } },
      include: { entries: true }
    });
    expect(journals).toHaveLength(1);
    expect(journals[0].entries).toHaveLength(2);
    const debit = journals[0].entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
    const credit = journals[0].entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
    expect(debit).toBe(1000);
    expect(credit).toBe(1000);
    const donations = await prisma.moneyDonation.findMany({ where: { id: { in: donationIds } } });
    expect(donations.filter(({ status }) => status === 'RECONCILED')).toHaveLength(1);
  }, 30_000);

  it('is idempotent when the same period is reconciled again', async () => {
    const rerun = await reconciliationService.execute(operatorAuth(), {
      scope: 'DONATIONS', periodStart, periodEnd
    });
    expect(rerun.matchedCount).toBe(1);
    expect(await prisma.ledgerJournal.count({
      where: { sourceType: 'DONATION', sourceId: { in: donationIds } }
    })).toBe(1);
    expect(rerun.items.find(({ outcome }) => outcome === 'MATCHED').ledgerJournalId)
      .toBe(firstRun.items.find(({ outcome }) => outcome === 'MATCHED').ledgerJournalId);
  }, 30_000);

  it('detects duplicate provider references before ledger posting', () => {
    const candidate = {
      sourceType: 'DONATION', sourceId: donationIds[0], provider: 'MPESA',
      providerReference: 'DUPLICATE', internalAmount: 100, providerAmount: 100,
      currency: 'KES', hasProcessedProviderEvent: true
    };
    expect(matchTransaction(candidate, new Map([['DUPLICATE', 2]]))).toMatchObject({
      outcome: 'DUPLICATE_REFERENCE'
    });
  });
});
