import { Prisma } from '@prisma/client';
import { ConflictError } from '../../errors/ConflictError.js';
import { recognitionService } from '../recognition/recognition.service.js';
import { donationAllocationService } from './donationAllocation.service.js';
import { donationReceiptService } from './donationReceipt.service.js';
import { createTrackingCredentials, verifyTrackingSecret } from './donationTracking.service.js';
import { toMoneyDonation, toTrackedDonation } from './moneyDonations.mapper.js';
import { DonationNotFoundError, DonationStateError } from './moneyDonations.errors.js';
import { assertCanReadDonation, assertDonationTransition } from './moneyDonations.policy.js';
import { moneyDonationsRepository } from './moneyDonations.repository.js';

function requireDonation(donation) {
  if (!donation) throw new DonationNotFoundError();
  return donation;
}

export function createMoneyDonationsService({
  repository = moneyDonationsRepository,
  allocations = donationAllocationService,
  receipts = donationReceiptService,
  recognition = recognitionService
} = {}) {
  async function transition(id, nextStatus, data) {
    const donation = requireDonation(await repository.findById(id));
    assertDonationTransition(donation.status, nextStatus);
    return repository.transition(id, donation.status, nextStatus, data);
  }

  return {
    async create(auth, input, idempotencyKey) {
      const donor = await repository.findDonorProfile(auth.user.id);
      if (!donor) throw new DonationNotFoundError();
      const tracking = createTrackingCredentials(`${donor.id}:${idempotencyKey}`);
      try {
        const donation = await repository.create({
          donorProfileId: donor.id,
          amount: new Prisma.Decimal(input.amount),
          channel: input.channel,
          purpose: input.purpose,
          purposeReference: input.purposeReference,
          trackingId: tracking.trackingId,
          trackingSecretHash: tracking.secretHash,
          idempotencyKey
        });
        return { donation: toMoneyDonation(donation), verificationSecret: tracking.secret };
      } catch (error) {
        if (error.code !== 'P2002') throw error;
        const existing = await repository.findByIdempotency(donor.id, idempotencyKey);
        if (!existing) throw new ConflictError('Donation identifier conflict. Please retry.');
        return { donation: toMoneyDonation(existing), verificationSecret: tracking.secret };
      }
    },
    async get(auth, donationId) {
      const donation = requireDonation(await repository.findById(donationId));
      assertCanReadDonation(auth, donation);
      return toMoneyDonation(donation);
    },
    async listMine(auth, query) {
      const donor = await repository.findDonorProfile(auth.user.id);
      if (!donor) throw new DonationNotFoundError();
      const result = await repository.listForDonor(donor.id, query);
      return { ...result, items: result.items.map(toMoneyDonation) };
    },
    async track(trackingId, secret) {
      const donation = requireDonation(await repository.findByTrackingId(trackingId));
      if (!verifyTrackingSecret(secret, donation.trackingSecretHash)) throw new DonationNotFoundError();
      return toTrackedDonation(donation);
    },
    requestPayment: (id, providerReference) =>
      transition(id, 'PAYMENT_REQUESTED', { providerReference }),
    markProviderPending: (id) => transition(id, 'PROVIDER_PENDING'),
    async confirm(id, confirmation) {
      const donation = requireDonation(await repository.findById(id));
      if (!new Prisma.Decimal(confirmation.amount).equals(donation.amount)) {
        throw new DonationStateError('Confirmed provider amount does not match the donation amount.');
      }
      assertDonationTransition(donation.status, 'CONFIRMED');
      return repository.transition(id, donation.status, 'CONFIRMED', {
        providerReference: confirmation.providerReference ?? donation.providerReference,
        providerReceipt: confirmation.providerReceipt,
        confirmedAt: confirmation.confirmedAt ?? new Date()
      });
    },
    async reconcile(id) {
      const current = requireDonation(await repository.findById(id));
      const reconciled =
        current.status === 'RECONCILED'
          ? current
          : await transition(id, 'RECONCILED', { reconciledAt: new Date() });
      await allocations.allocate(reconciled, {
        allocationType: 'CENTRAL_POOL',
        targetReference: 'CHARITYCHAIN_CENTRAL_POOL',
        amount: reconciled.amount
      });
      await receipts.issue(reconciled);
      await recognition.recordMoney(reconciled.donorProfile.userId, reconciled.id, reconciled.amount);
      return toMoneyDonation(requireDonation(await repository.findById(id)));
    },
    fail: (id, failureCode, failureReason) =>
      transition(id, 'FAILED', { failureCode, failureReason }),
    async reverse(id) {
      const original = requireDonation(await repository.findById(id));
      const reversed =
        original.status === 'REVERSED'
          ? original
          : await (async () => {
              assertDonationTransition(original.status, 'REVERSED');
              return repository.transition(id, original.status, 'REVERSED', {
                reversedAt: new Date()
              });
            })();
      await repository.reverseAllocations(id);
      await receipts.void(id);
      if (original.status === 'RECONCILED' || original.status === 'REVERSED') {
        await recognition.removeMoney(original.donorProfile.userId, original.id);
      }
      return toMoneyDonation(reversed);
    }
  };
}

export const moneyDonationsService = createMoneyDonationsService();
