export function toMoneyDonation(donation) {
  return Object.freeze({
    id: donation.id,
    amount: donation.amount.toString(),
    currency: donation.currency,
    channel: donation.channel,
    purpose: donation.purpose,
    purposeReference: donation.purposeReference,
    status: donation.status,
    trackingId: donation.trackingId,
    providerReference: donation.providerReference,
    providerReceipt: donation.providerReceipt,
    confirmedAt: donation.confirmedAt,
    reconciledAt: donation.reconciledAt,
    reversedAt: donation.reversedAt,
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
    receipt: donation.receipt
      ? {
          receiptNumber: donation.receipt.receiptNumber,
          evidenceDigest: donation.receipt.evidenceDigest,
          ipfsCid: donation.receipt.ipfsCid,
          issuedAt: donation.receipt.issuedAt,
          voidedAt: donation.receipt.voidedAt
        }
      : null,
    allocations: donation.allocations?.map((allocation) => ({
      id: allocation.id,
      allocationType: allocation.allocationType,
      targetReference: allocation.targetReference,
      amount: allocation.amount.toString(),
      status: allocation.status,
      createdAt: allocation.createdAt
    })) ?? []
  });
}

export function toTrackedDonation(donation) {
  return Object.freeze({
    trackingId: donation.trackingId,
    amount: donation.amount.toString(),
    currency: donation.currency,
    purpose: donation.purpose,
    status: donation.status,
    confirmedAt: donation.confirmedAt,
    reconciledAt: donation.reconciledAt,
    allocations: donation.allocations?.map((allocation) => ({
      allocationType: allocation.allocationType,
      amount: allocation.amount.toString(),
      status: allocation.status
    })) ?? [],
    receipt: donation.receipt
      ? { receiptNumber: donation.receipt.receiptNumber, issuedAt: donation.receipt.issuedAt }
      : null
  });
}
