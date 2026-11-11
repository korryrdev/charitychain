import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
import { DonationStateError } from './moneyDonations.errors.js';

const transitions = Object.freeze({
  CREATED: ['PAYMENT_REQUESTED', 'FAILED'],
  PAYMENT_REQUESTED: ['PROVIDER_PENDING', 'CONFIRMED', 'FAILED'],
  PROVIDER_PENDING: ['CONFIRMED', 'FAILED'],
  CONFIRMED: ['RECONCILED', 'REVERSED'],
  RECONCILED: ['REVERSED'],
  FAILED: [],
  REVERSED: []
});

export function assertDonationTransition(currentStatus, nextStatus) {
  if (!transitions[currentStatus]?.includes(nextStatus)) {
    throw new DonationStateError(`Donation cannot transition from ${currentStatus} to ${nextStatus}.`);
  }
}

export function assertCanReadDonation(auth, donation) {
  if (
    donation.donorProfile.userId === auth.user.id ||
    auth.permissions.includes(PERMISSIONS.DONATION_READ_ALL)
  ) return;
  throw new AuthorizationError();
}
