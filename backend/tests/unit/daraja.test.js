import { describe, it, expect, beforeEach } from 'vitest';
import { DarajaService } from '../../src/modules/daraja/daraja.service.js';
import { AuthorizationError } from '../../src/errors/AuthorizationError.js';
import { prisma } from '@charitychain/database';

describe('G07 & G08: Daraja C2B Intake and Lot Creation (FR-INT-01 to 04, FR-INT-10)', () => {
  let service;
  const validToken = 'test-daraja-token';

  beforeEach(() => {
    process.env.DARAJA_CALLBACK_TOKEN = validToken;
    service = new DarajaService();
  });

  it('rejects confirmation with invalid token', async () => {
    await expect(
      service.handleConfirmation('wrong-token', { TransID: 'TX1' })
    ).rejects.toThrow(AuthorizationError);
  });

  it('validates C2B validation endpoint and returns Accepted', async () => {
    const res = await service.handleValidation(validToken, { TransID: 'TX100' });
    expect(res).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
  });

  it('provisions a DonationLot and queues outbox event on confirmation', async () => {
    const transId = `TEST_DARAJA_${Date.now()}`;
    const payload = {
      TransID: transId,
      TransAmount: '1500.00',
      MSISDN: '254712345678',
      BillRefNumber: 'FEES',
      TransTime: '20261110150000',
    };

    const res = await service.handleConfirmation(validToken, payload);

    expect(res.ResultCode).toBe(0);
    expect(res.receiptCode).toMatch(/^MLK-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    // Verify raw callback was stored immutably
    const raw = await prisma.donationRawCallback.findFirst({
      where: { externalTransactionId: transId },
    });
    expect(raw).toBeTruthy();
    expect(raw.provider).toBe('DARAJA');

    // Verify DonationLot was created
    const lot = await prisma.donationLot.findFirst({
      where: { receiptCode: res.receiptCode },
    });
    expect(lot).toBeTruthy();
    expect(lot.totalAmountMinor).toBe(150000n);
    expect(lot.remainingAmountMinor).toBe(150000n);
    expect(lot.channel).toBe('MPESA');
    expect(lot.earmark).toBe('FEES');

    // Verify OutboxEvent was created
    const outbox = await prisma.outboxEvent.findFirst({
      where: { aggregateId: lot.id, eventName: 'donation.recorded' },
    });
    expect(outbox).toBeTruthy();
    expect(outbox.payload.receiptCode).toBe(res.receiptCode);

    // Idempotency: second confirmation with same TransID does not create another lot
    const res2 = await service.handleConfirmation(validToken, payload);
    expect(res2.ResultCode).toBe(0);

    const count = await prisma.donationLot.count({
      where: { sourceRefHash: lot.sourceRefHash },
    });
    expect(count).toBe(1);
  });
});
