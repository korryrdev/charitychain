import { createHash, randomBytes } from 'node:crypto';
import { moneyDonationsRepository } from './moneyDonations.repository.js';

function canonicalReceipt(donation) {
  return JSON.stringify({
    donationId: donation.id,
    trackingId: donation.trackingId,
    amount: donation.amount.toString(),
    currency: donation.currency,
    channel: donation.channel,
    purpose: donation.purpose,
    providerReference: donation.providerReference,
    providerReceipt: donation.providerReceipt,
    confirmedAt: donation.confirmedAt?.toISOString()
  });
}

export function createDonationReceiptService(repository = moneyDonationsRepository) {
  return {
    async issue(donation) {
      const evidenceDigest = createHash('sha256').update(canonicalReceipt(donation)).digest('hex');
      const receiptNumber = `MRC-${randomBytes(8).toString('hex').toUpperCase()}`;
      return repository.createReceipt({ donationId: donation.id, receiptNumber, evidenceDigest });
    },
    void: (donationId) => repository.voidReceipt(donationId)
  };
}

export const donationReceiptService = createDonationReceiptService();
