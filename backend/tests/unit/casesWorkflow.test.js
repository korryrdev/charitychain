import { describe, it, expect, beforeEach } from 'vitest';
import { CasesService } from '../../src/modules/cases/cases.service.js';
import { AuthorizationError } from '../../src/errors/AuthorizationError.js';
import { ConflictError } from '../../src/errors/ConflictError.js';
import { prisma } from '@charitychain/database';
import { randomUUID } from 'node:crypto';

describe('G13–G16: Case State Machine, Decision, 2-of-3 Authorization & Disbursement (FR-CASE-01 to 07, R01–R03)', () => {
  let service;
  let testSubgroup;
  const submitterId = randomUUID();
  const approverId = randomUUID();
  const signatory1 = '0x' + '11'.repeat(65);
  const signatory2 = '0x' + '22'.repeat(65);

  beforeEach(async () => {
    service = new CasesService();

    testSubgroup = await prisma.subgroup.create({
      data: {
        code: `SG-FLOW-${Date.now()}`,
        name: 'Workflow Test Subgroup',
      },
    });

    // Provide KES lots for disbursement testing
    await prisma.donationLot.create({
      data: {
        receiptCode: `MLK-CASE-${Date.now().toString().slice(-4)}`,
        sourceRefHash: '0x' + '77'.repeat(32),
        donorRef: '0x' + '88'.repeat(32),
        totalAmountMinor: 500000n, // KES 5,000
        remainingAmountMinor: 500000n,
        currency: 'KES',
        channel: 'MPESA',
      },
    });
  });

  it('runs complete case lifecycle: DRAFT -> SUBMITTED -> APPROVED -> AUTHORIZED -> DISBURSED', async () => {
    // 1. Create Case in DRAFT
    const created = await service.createCase({
      subGroupId: testSubgroup.id,
      studentName: 'Alice Muthoni',
      studentRegNo: `CT201/${String(Date.now()).slice(-6)}/24`,
      studentPhone: '0712345678',
      needCategory: 'FEES',
      requestedAmount: '3500.00',
      justification: 'Semester tuition fees arrears.',
      hasConsent: true,
      createdByUserId: submitterId,
    });

    expect(created.state).toBe('DRAFT');
    expect(created.requestedAmountMinor).toBe(350000n);
    expect(created.caseNumber).toMatch(/^C-\d{4}$/);

    // 2. Submit Case
    const submitted = await service.submitCase(created.id, submitterId);
    expect(submitted.state).toBe('SUBMITTED');

    // 3. R03: Submitter cannot approve their own case
    await expect(
      service.recordDecision(created.id, { decision: 'APPROVED', approvedAmount: '3500.00' }, submitterId)
    ).rejects.toThrow(AuthorizationError);

    // 4. Committee member approves case
    const approved = await service.recordDecision(
      created.id,
      { decision: 'APPROVED', approvedAmount: '3000.00', notes: 'Approved partial tuition assistance.' },
      approverId
    );
    expect(approved.state).toBe('APPROVED');
    expect(approved.approvedAmountMinor).toBe(300000n);

    // 5. 2-of-3 Signatories Authorize Release
    const authorized = await service.authorizeRelease(
      created.id,
      {
        amountMinor: 300000n,
        nonce: 0,
        deadline: Math.floor(Date.now() / 1000) + 3600,
        signatures: [signatory1, signatory2],
      },
      approverId
    );
    expect(authorized.state).toBe('AUTHORIZED');

    // 6. R02: Disbursement larger than authorized amount is rejected
    await expect(
      service.disburse(
        created.id,
        {
          amount: '4000.00',
          method: 'MPESA',
          methodReference: 'NL888XX',
        },
        approverId
      )
    ).rejects.toThrow(ConflictError);

    // 7. Successful disbursement consumes FIFO lots
    const disbursed = await service.disburse(
      created.id,
      {
        amount: '3000.00',
        method: 'MPESA',
        methodReference: 'NL888XX',
        evidenceCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      },
      approverId
    );

    expect(disbursed.case.state).toBe('DISBURSED');
    expect(disbursed.case.disbursedAmountMinor).toBe(300000n);
    expect(disbursed.allocations.length).toBeGreaterThan(0);
  });
});

