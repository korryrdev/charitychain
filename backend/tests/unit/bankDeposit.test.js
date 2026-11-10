import { describe, it, expect, beforeEach } from 'vitest';
import { BankService } from '../../src/modules/bank/bank.service.js';
import { AuthorizationError } from '../../src/errors/AuthorizationError.js';
import { ConflictError } from '../../src/errors/ConflictError.js';
import { prisma } from '@charitychain/database';
import { randomUUID } from 'node:crypto';

describe('G09: Bank Deposit Maker-Checker (FR-INT-06, R04)', () => {
  let service;
  const entrantId = randomUUID();
  const verifierId = randomUUID();

  beforeEach(() => {
    service = new BankService();
  });

  it('enters bank deposit as PENDING_VERIFICATION without creating lot', async () => {
    const depositReference = `BANK-REF-${Date.now()}`;
    const deposit = await service.createDeposit({
      depositReference,
      donorIdentity: 'ALUMNI_JANE_DOE',
      amount: '5000.00',
      consentVersion: 'v1.0',
      enteredByUserId: entrantId,
    });

    expect(deposit.status).toBe('PENDING_VERIFICATION');
    expect(deposit.amountMinor).toBe(500000n);

    // Lot must NOT exist until verified
    const lot = await prisma.donationLot.findFirst({
      where: { sourceRefHash: deposit.depositReference },
    });
    expect(lot).toBeNull();
  });

  it('R04: blocks entrant from verifying their own bank deposit', async () => {
    const depositReference = `BANK-REF-${Date.now()}`;
    const deposit = await service.createDeposit({
      depositReference,
      donorIdentity: 'SELF_VERIFY_TEST',
      amount: '2000.00',
      consentVersion: 'v1.0',
      enteredByUserId: entrantId,
    });

    await expect(
      service.verifyDeposit(deposit.id, entrantId)
    ).rejects.toThrow(AuthorizationError);
  });

  it('allows different verifier to verify deposit and provisions DonationLot', async () => {
    const depositReference = `BANK-REF-${Date.now()}`;
    const deposit = await service.createDeposit({
      depositReference,
      donorIdentity: 'ALUMNI_JOHN_DOE',
      amount: '10000.00',
      consentVersion: 'v1.0',
      enteredByUserId: entrantId,
    });

    const result = await service.verifyDeposit(deposit.id, verifierId, 'TUITION');

    expect(result.deposit.status).toBe('VERIFIED');
    expect(result.deposit.verifiedByUserId).toBe(verifierId);
    expect(result.lot.receiptCode).toMatch(/^MLK-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(result.lot.totalAmountMinor).toBe(1000000n);
    expect(result.lot.channel).toBe('BANK');

    // Attempting to verify again must fail
    await expect(
      service.verifyDeposit(deposit.id, verifierId)
    ).rejects.toThrow(ConflictError);
  });
});
