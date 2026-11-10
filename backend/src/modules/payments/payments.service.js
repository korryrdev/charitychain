import { Prisma } from '@prisma/client';
import { AppError } from '../../errors/AppError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { moneyDonationsService } from '../moneyDonations/moneyDonations.service.js';
import { digestPayload, fingerprintDestination } from './paymentIdempotency.service.js';
import { paymentProviderFactory } from './paymentProviderFactory.js';
import { toPaymentAttempt } from './payments.mapper.js';
import { assertCanUseDonation, assertDonationPayable } from './payments.policy.js';
import { paymentsRepository } from './payments.repository.js';
import { assertProviderStatusApplicable, paymentStatusFields } from './paymentStatus.service.js';
import { providerEventSecret, verifyProviderEvent } from './providerEvent.service.js';

function notFound(message = 'Payment not found.') { return new AppError({ message, code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 }); }

export function createPaymentsService({ repository = paymentsRepository, providers = paymentProviderFactory, donations = moneyDonationsService, secretFor = providerEventSecret } = {}) {
  return {
    async initiate(auth, input, idempotencyKey) {
      const donation = await repository.findDonation(input.donationId); if (!donation) throw notFound('Donation not found.');
      assertCanUseDonation(auth, donation);
      const { provider, flow, adapter } = providers.forDonation(donation);
      if (flow === 'STK_PUSH' && !input.phoneNumber) throw new ConflictError('A phone number is required for M-Pesa STK Push.');
      const requestPayloadDigest = digestPayload({ donationId: donation.id, amount: donation.amount.toString(), currency: donation.currency, flow, returnUrl: input.returnUrl ?? null, destinationFingerprint: fingerprintDestination(input.phoneNumber) });
      const replay = await repository.findAttemptByIdempotency(donation.id, idempotencyKey);
      if (replay) {
        if (replay.requestPayloadDigest !== requestPayloadDigest) throw new ConflictError('Payment idempotency key conflicts with another request.', { code: ERROR_CODES.IDEMPOTENCY_CONFLICT });
        return toPaymentAttempt(replay);
      }
      assertDonationPayable(donation);
      let attempt;
      try { attempt = await repository.createAttempt({ donationId: donation.id, provider, flow, amount: donation.amount, currency: donation.currency, idempotencyKey, destinationFingerprint: fingerprintDestination(input.phoneNumber), requestPayloadDigest }); }
      catch (error) { if (error.code !== 'P2002') throw error; const existing = await repository.findAttemptByIdempotency(donation.id, idempotencyKey); if (!existing || existing.requestPayloadDigest !== requestPayloadDigest) throw new ConflictError('Payment idempotency key conflicts with another request.', { code: ERROR_CODES.IDEMPOTENCY_CONFLICT }); return toPaymentAttempt(existing); }
      try {
        const response = await adapter.initiate({ attempt, donation, phoneNumber: input.phoneNumber, returnUrl: input.returnUrl });
        await donations.requestPayment(donation.id, response.providerRequestId);
        attempt = await repository.transitionAttempt(attempt.id, ['INITIATED'], response.status === 'PENDING' ? 'PENDING' : 'SUBMITTED', { providerRequestId: response.providerRequestId, responseCode: response.responseCode, responseMessage: response.responseMessage, submittedAt: new Date() });
        return toPaymentAttempt(attempt);
      } catch (error) {
        await repository.transitionAttempt(attempt.id, ['INITIATED'], 'FAILED', { responseCode: error.code ?? 'INITIATION_FAILED', responseMessage: error.message, failedAt: new Date() });
        throw error;
      }
    },
    async get(auth, id) { const attempt = await repository.findAttempt(id); if (!attempt) throw notFound(); assertCanUseDonation(auth, attempt.donation); return toPaymentAttempt(attempt); },
    async listForDonation(auth, donationId) { const donation = await repository.findDonation(donationId); if (!donation) throw notFound('Donation not found.'); assertCanUseDonation(auth, donation); return (await repository.listForDonation(donationId)).map(toPaymentAttempt); },
    async processProviderEvent(providerName, payload, signature) {
      const provider = providerName.toUpperCase();
      const verification = verifyProviderEvent(payload, signature, secretFor(provider));
      let event = await repository.findProviderEvent(provider, payload.eventId);
      if (event && event.payloadDigest !== verification.payloadDigest) throw new ConflictError('Provider event identifier was reused with a different payload.', { code: ERROR_CODES.CALLBACK_DUPLICATE });
      if (event?.processingStatus === 'PROCESSED') return { accepted: true, duplicate: true };
      let attempt = await repository.findAttemptByProviderRequest(payload.providerRequestId);
      if (!attempt) {
        const directDonation = await repository.findDonationByTrackingId(payload.providerRequestId);
        const expectedChannel = provider === 'MPESA' ? 'MPESA_PAYBILL' : 'BANK';
        if (!directDonation || directDonation.channel !== expectedChannel || directDonation.status !== 'CREATED') throw notFound('Payment provider reference was not found.');
        attempt = await repository.createAttempt({ donationId: directDonation.id, provider, flow: provider === 'MPESA' ? 'C2B' : 'BANK_TRANSFER', status: 'PENDING', amount: directDonation.amount, currency: directDonation.currency, idempotencyKey: `provider-event:${payload.eventId}`, requestPayloadDigest: verification.payloadDigest, providerRequestId: payload.providerRequestId, submittedAt: new Date() });
        await donations.requestPayment(directDonation.id, payload.providerRequestId);
        attempt = await repository.findAttempt(attempt.id);
      }
      if (attempt.provider !== provider) throw notFound('Payment provider reference was not found.');
      if (!event) event = await repository.createProviderEvent({ paymentAttemptId: attempt.id, provider, providerEventId: payload.eventId, eventType: payload.eventType, payloadDigest: verification.payloadDigest, signatureDigest: verification.signatureDigest });
      try {
        assertProviderStatusApplicable(attempt, payload.status);
        if (payload.status === 'SUCCEEDED') {
          if (!payload.amount || !new Prisma.Decimal(payload.amount).equals(attempt.amount) || payload.currency !== attempt.currency) throw new ConflictError('Provider amount or currency does not match the payment attempt.', { code: ERROR_CODES.RECONCILIATION_MISMATCH });
          await donations.confirm(attempt.donationId, { amount: payload.amount, providerReference: payload.providerRequestId, providerReceipt: payload.providerTransactionId, confirmedAt: payload.occurredAt });
          await donations.reconcile(attempt.donationId);
        } else if (payload.status === 'PENDING' && attempt.donation.status === 'PAYMENT_REQUESTED') await donations.markProviderPending(attempt.donationId);
        else if (payload.status === 'FAILED') await donations.fail(attempt.donationId, payload.resultCode ?? 'PROVIDER_FAILED', payload.resultMessage ?? 'Provider rejected payment.');
        await repository.transitionAttempt(attempt.id, ['SUBMITTED', 'PENDING', 'INITIATED'], payload.status, { providerTransactionId: payload.providerTransactionId, responseCode: payload.resultCode, responseMessage: payload.resultMessage, ...paymentStatusFields(payload.status, payload) });
        await repository.completeProviderEvent(event.id, { resultCode: payload.resultCode, resultMessage: payload.resultMessage });
        return { accepted: true, duplicate: false };
      } catch (error) { await repository.rejectProviderEvent(event.id, error.code ?? 'PROCESSING_FAILED', error.message); throw error; }
    }
  };
}

export const paymentsService = createPaymentsService();
