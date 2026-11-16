import { prisma } from '@charitychain/database';
import { afterAll, describe, expect, it } from 'vitest';
import { authService } from '../../src/modules/auth/auth.service.js';
import { moneyDonationsService } from '../../src/modules/moneyDonations/moneyDonations.service.js';
import { createPaymentProviderFactory } from '../../src/modules/payments/paymentProviderFactory.js';
import { createPaymentsService } from '../../src/modules/payments/payments.service.js';
import { signProviderEvent } from '../../src/modules/payments/providerEvent.service.js';

const secret = 'section-10-callback-secret-that-is-long-enough';
const email = `section10-${Date.now()}@example.test`;
let user;
let donation;
let payment;
let directDonation;
let adapterCalls = 0;
const auth = () => ({ user, session: { id: 'section10-session' }, permissions: [] });
const providers = createPaymentProviderFactory({
  adapters: {
    MPESA: {
      async initiate() {
        adapterCalls += 1;
        return {
          providerRequestId: `MPESA-REQUEST-SECTION10-${adapterCalls}`,
          status: 'PENDING',
          responseCode: '0',
          responseMessage: 'Accepted'
        };
      }
    },
    BANK: null
  }
});
const service = createPaymentsService({
  providers,
  secretFor: () => secret,
  stkQuery: { query: async () => ({ resultCode: '0' }) }
});

afterAll(async () => {
  if (!user?.id) return;
  const donations = await prisma.moneyDonation.findMany({
    where: { donorProfile: { userId: user.id } },
    select: { id: true }
  });
  const ids = donations.map(({ id }) => id);
  const attempts = await prisma.paymentAttempt.findMany({
    where: { donationId: { in: ids } },
    select: { id: true }
  });
  await prisma.paymentProviderEvent.deleteMany({
    where: { paymentAttemptId: { in: attempts.map(({ id }) => id) } }
  });
  await prisma.paymentAttempt.deleteMany({ where: { donationId: { in: ids } } });
  await prisma.donationReceipt.deleteMany({ where: { donationId: { in: ids } } });
  await prisma.donationAllocation.deleteMany({ where: { donationId: { in: ids } } });
  await prisma.moneyDonation.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: user.id } });
});

describe('Section 10 payment orchestration and provider ingestion', () => {
  it('initiates M-Pesa once and safely replays the same idempotency key', async () => {
    user = (
      await authService.register({
        name: 'Section Ten Donor',
        email,
        password: 'Section10-Strong-Password-42!'
      })
    ).user;
    donation = (
      await moneyDonationsService.create(
        auth(),
        { amount: '12500.00', channel: 'MPESA_STK', purpose: 'UNRESTRICTED' },
        'section10-donation'
      )
    ).donation;
    const input = { donationId: donation.id, phoneNumber: '254712345678' };
    payment = await service.initiate(auth(), input, 'section10-payment');
    const replay = await service.initiate(auth(), input, 'section10-payment');
    expect(replay).toEqual(payment);
    expect(adapterCalls).toBe(1);
    expect(payment).toMatchObject({ provider: 'MPESA', flow: 'STK_PUSH', status: 'PENDING' });
    const stored = await prisma.paymentAttempt.findUniqueOrThrow({ where: { id: payment.id } });
    expect(stored.destinationFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(stored)).not.toContain('254712345678');
  }, 30_000);

  it('rejects unauthenticated and amount-mismatched callbacks before financial recognition', async () => {
    const mismatch = {
      eventId: 'event-section10-mismatch',
      eventType: 'PAYMENT_RESULT',
      providerRequestId: payment.providerRequestId,
      providerTransactionId: 'TX-SECTION10-WRONG',
      status: 'SUCCEEDED',
      amount: 12499,
      currency: 'KES'
    };
    await expect(
      service.processProviderEvent('mpesa', mismatch, '0'.repeat(64))
    ).rejects.toMatchObject({ code: 'CALLBACK_INVALID' });
    expect(
      await prisma.paymentProviderEvent.count({ where: { providerEventId: mismatch.eventId } })
    ).toBe(0);
    await expect(
      service.processProviderEvent('mpesa', mismatch, signProviderEvent(mismatch, secret))
    ).rejects.toMatchObject({ code: 'RECONCILIATION_MISMATCH' });
    expect(
      (
        await prisma.paymentProviderEvent.findUniqueOrThrow({
          where: {
            provider_providerEventId: { provider: 'MPESA', providerEventId: mismatch.eventId }
          }
        })
      ).processingStatus
    ).toBe('REJECTED');
    expect(
      await prisma.recognizedContribution.count({
        where: { sourceType: 'MONEY', sourceId: donation.id }
      })
    ).toBe(0);
  });

  it('processes a successful callback once and reconciles the donation end to end', async () => {
    const success = {
      eventId: `${payment.providerRequestId}:0`,
      eventType: 'STK_RESULT',
      providerRequestId: payment.providerRequestId,
      providerTransactionId: 'TX-SECTION10-SUCCESS',
      status: 'SUCCEEDED',
      amount: 12500,
      currency: 'KES',
      resultCode: '0',
      occurredAt: new Date('2026-11-08T15:00:00.000Z')
    };
    expect(await service.processMpesaCallback(success)).toEqual({
      accepted: true,
      duplicate: false
    });
    expect(await service.processMpesaCallback(success)).toEqual({
      accepted: true,
      duplicate: true
    });
    const storedPayment = await prisma.paymentAttempt.findUniqueOrThrow({
      where: { id: payment.id }
    });
    const storedDonation = await prisma.moneyDonation.findUniqueOrThrow({
      where: { id: donation.id }
    });
    expect(storedPayment.status).toBe('SUCCEEDED');
    expect(storedDonation.status).toBe('RECONCILED');
    expect(
      await prisma.paymentProviderEvent.count({ where: { providerEventId: success.eventId } })
    ).toBe(1);
    expect(
      await prisma.recognizedContribution.count({
        where: { sourceType: 'MONEY', sourceId: donation.id }
      })
    ).toBe(1);
  }, 30_000);

  it('rejects event-id reuse with altered callback content', async () => {
    const altered = {
      eventId: `${payment.providerRequestId}:0`,
      eventType: 'STK_RESULT',
      providerRequestId: payment.providerRequestId,
      providerTransactionId: 'TX-ALTERED',
      status: 'SUCCEEDED',
      amount: 12500,
      currency: 'KES',
      resultCode: '0'
    };
    await expect(
      service.processProviderEvent('mpesa', altered, signProviderEvent(altered, secret))
    ).rejects.toMatchObject({ code: 'CALLBACK_DUPLICATE' });
  });

  it('refreshes STK status from Daraja and records success or user cancellation', async () => {
    const successDonation = (
      await moneyDonationsService.create(
        auth(),
        { amount: '1000.00', channel: 'MPESA_STK', purpose: 'UNRESTRICTED' },
        'section10-refresh-success'
      )
    ).donation;
    const successPayment = await service.initiate(
      auth(),
      { donationId: successDonation.id, phoneNumber: '254712345678' },
      'section10-refresh-success-payment'
    );
    const refreshedSuccess = await service.refresh(auth(), successPayment.id);
    expect(refreshedSuccess.status).toBe('SUCCEEDED');
    expect(
      await prisma.moneyDonation.findUniqueOrThrow({ where: { id: successDonation.id } })
    ).toMatchObject({ status: 'RECONCILED', providerReference: successPayment.providerRequestId });

    await expect(
      service.processMpesaCallback({
        eventId: `${successPayment.providerRequestId}:0`,
        eventType: 'STK_RESULT',
        providerRequestId: successPayment.providerRequestId,
        providerTransactionId: 'TX-SECTION10-LATE-CALLBACK',
        status: 'SUCCEEDED',
        amount: 1000,
        currency: 'KES',
        resultCode: '0'
      })
    ).resolves.toMatchObject({ accepted: true, duplicate: false });

    const cancelledDonation = (
      await moneyDonationsService.create(
        auth(),
        { amount: '1000.00', channel: 'MPESA_STK', purpose: 'UNRESTRICTED' },
        'section10-refresh-cancelled'
      )
    ).donation;
    const cancelledPayment = await service.initiate(
      auth(),
      { donationId: cancelledDonation.id, phoneNumber: '254712345678' },
      'section10-refresh-cancelled-payment'
    );
    const cancelledService = createPaymentsService({
      providers,
      secretFor: () => secret,
      stkQuery: {
        query: async () => ({
          resultCode: '1032',
          resultMessage: 'Request cancelled by user.'
        })
      }
    });
    const refreshedCancellation = await cancelledService.refresh(auth(), cancelledPayment.id);
    expect(refreshedCancellation).toMatchObject({
      status: 'CANCELLED',
      responseCode: '1032',
      responseMessage: 'Request cancelled by user.'
    });
    expect(
      await prisma.moneyDonation.findUniqueOrThrow({ where: { id: cancelledDonation.id } })
    ).toMatchObject({ status: 'FAILED', failureCode: '1032' });
  }, 30_000);

  it('ingests a direct Paybill credit using the private donation reference', async () => {
    directDonation = (
      await moneyDonationsService.create(
        auth(),
        { amount: '2500.00', channel: 'MPESA_PAYBILL', purpose: 'UPKEEP' },
        'section10-paybill-donation'
      )
    ).donation;
    const event = {
      eventId: 'event-section10-paybill',
      eventType: 'C2B_CREDIT',
      providerRequestId: directDonation.trackingId,
      providerTransactionId: 'PAYBILL-SECTION10-1',
      status: 'SUCCEEDED',
      amount: 2500,
      currency: 'KES'
    };
    await service.processProviderEvent('mpesa', event, signProviderEvent(event, secret));
    const stored = await prisma.moneyDonation.findUniqueOrThrow({
      where: { id: directDonation.id }
    });
    const attempt = await prisma.paymentAttempt.findFirstOrThrow({
      where: { donationId: directDonation.id }
    });
    expect(stored.status).toBe('RECONCILED');
    expect(attempt).toMatchObject({ flow: 'C2B', status: 'SUCCEEDED' });
  }, 30_000);
});
