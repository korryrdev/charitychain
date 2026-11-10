import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
import { ConflictError } from '../../errors/ConflictError.js';

export function assertCanUseDonation(auth, donation) {
  if (donation?.donorProfile?.userId === auth.user.id || auth.permissions.includes(PERMISSIONS.DONATION_READ_ALL)) return;
  throw new AuthorizationError();
}
export function assertDonationPayable(donation) {
  if (donation.status !== 'CREATED') throw new ConflictError('Only a newly created donation can start payment.');
}
