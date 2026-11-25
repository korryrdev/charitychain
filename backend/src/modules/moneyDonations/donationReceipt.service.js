import { createHash, randomBytes } from 'node:crypto';
import { moneyDonationsRepository } from './moneyDonations.repository.js';

export function canonicalReceipt(donation) {
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
    void: (donationId) => repository.voidReceipt(donationId),
    document(donation) {
      return Object.freeze({
        receiptNumber: donation.receipt.receiptNumber,
        issuedAt: donation.receipt.issuedAt,
        voidedAt: donation.receipt.voidedAt,
        evidenceDigest: donation.receipt.evidenceDigest,
        ipfsCid: donation.receipt.ipfsCid,
        donation: {
          trackingId: donation.trackingId,
          amount: donation.amount.toString(),
          currency: donation.currency,
          channel: donation.channel,
          purpose: donation.purpose,
          purposeReference: donation.purposeReference,
          providerReference: donation.providerReference,
          providerReceipt: donation.providerReceipt,
          confirmedAt: donation.confirmedAt,
          reconciledAt: donation.reconciledAt,
          status: donation.status
        }
      });
    },
    verify(donation) {
      const expectedDigest = createHash('sha256').update(canonicalReceipt(donation)).digest('hex');
      return Object.freeze({
        valid: !donation.receipt.voidedAt && donation.receipt.evidenceDigest === expectedDigest,
        receiptNumber: donation.receipt.receiptNumber,
        evidenceDigest: donation.receipt.evidenceDigest,
        voidedAt: donation.receipt.voidedAt
      });
    }
  };
}

export const donationReceiptService = createDonationReceiptService();
