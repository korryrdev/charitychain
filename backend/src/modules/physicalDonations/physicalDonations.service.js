import { Prisma } from '@prisma/client';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { blindIndex, decryptString, encryptString } from '../../security/encryption.js';
import { toPhysicalDonation } from './physicalDonations.mapper.js';
import { assertRecordAccess, assertStatus } from './physicalDonations.policy.js';
import { physicalDonationsRepository } from './physicalDonations.repository.js';

function requireDonation(value) { if (!value) throw new AppError({ message: 'Physical donation not found.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 }); return value; }
export function createPhysicalDonationsService(repository = physicalDonationsRepository) { return {
  async create(auth, input) { assertRecordAccess(auth); const donation = await repository.create({ clerkUserId: auth.user.id, donorProfileId: input.donorProfileId, donorName: input.donorName, donorPhoneEncrypted: encryptString(input.donorPhone), donorPhoneHash: blindIndex(input.donorPhone), donorPhoneLast4: input.donorPhone.slice(-4), kind: input.kind }, input.lines.map((line) => ({ ...line, declaredValue: line.declaredValue === undefined ? undefined : new Prisma.Decimal(line.declaredValue) }))); return toPhysicalDonation(donation); },
  async submit(auth, id) { assertRecordAccess(auth); const donation = requireDonation(await repository.findById(id)); if (donation.clerkUserId !== auth.user.id) throw new AppError({ message: 'Only the recording clerk can submit this draft.', code: ERROR_CODES.FORBIDDEN, statusCode: 403 }); assertStatus(donation, ['DRAFT']); const submitted = await repository.transition(id, 'DRAFT', 'AWAITING_DONOR_CONFIRMATION', { submittedAt: new Date() }); return toPhysicalDonation(requireDonation(submitted)); },
  async get(auth, id) { const donation = requireDonation(await repository.findById(id)); if (donation.clerkUserId !== auth.user.id && !auth.permissions.includes('physical-donation:inspect')) throw new AppError({ message: 'Access denied.', code: ERROR_CODES.FORBIDDEN, statusCode: 403 }); return toPhysicalDonation(donation); },
  async list(auth, query) { if (!auth.permissions.some((item) => ['physical-donation:record','physical-donation:inspect'].includes(item))) throw new AppError({ message: 'Access denied.', code: ERROR_CODES.FORBIDDEN, statusCode: 403 }); const result = await repository.list(query); return { ...result, items: result.items.map(toPhysicalDonation) }; },
  async confirmationTarget(id) { const donation = requireDonation(await repository.findById(id)); assertStatus(donation, ['AWAITING_DONOR_CONFIRMATION']); return { phoneNumber: decryptString(donation.donorPhoneEncrypted), donorName: donation.donorName, version: donation.submissionVersion, lines: donation.lines.map((line) => ({ itemName: line.itemName, quantity: line.quantity, unit: line.unit, declaredValue: line.declaredValue?.toString() ?? null })) }; },
  async recordDonorDecision(id, accepted) { const donation = requireDonation(await repository.findById(id)); assertStatus(donation, ['AWAITING_DONOR_CONFIRMATION']); const status = accepted ? (donation.kind === 'CASH' ? 'DEPOSIT_PENDING' : 'CONFIRMED') : 'REJECTED'; const updated = await repository.transition(id, donation.status, status, accepted ? { confirmedAt: new Date() } : { rejectedAt: new Date() }); return toPhysicalDonation(requireDonation(updated)); }
}; }
export const physicalDonationsService = createPhysicalDonationsService();
