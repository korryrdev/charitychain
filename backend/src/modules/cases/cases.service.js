'use strict';

import { prisma } from '@charitychain/database';
import { toMinorUnits } from '../../utils/money.js';
import { encryptString, decryptString, blindIndex } from '../../security/encryption.js';
import { assertSegregation, assertState } from '../../utils/assertions.js';
import { lotsService } from '../lots/lots.service.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { logger } from '../../observability/logger.js';

export class CasesService {
  async createCase({ subGroupId, studentName, studentRegNo, studentPhone, needCategory, requestedAmount, justification, hasConsent = true, createdByUserId }) {
    const subGroup = await prisma.subgroup.findUnique({
      where: { id: subGroupId },
    });
    if (!subGroup) {
      throw new ConflictError(`Sub-group with ID "${subGroupId}" not found.`);
    }

    const requestedAmountMinor = toMinorUnits(requestedAmount, 'KES');
    const studentIdentifierHash = `0x${blindIndex(studentRegNo.trim().toUpperCase())}`;
    const encryptedStudentData = encryptString(
      JSON.stringify({
        name: studentName.trim(),
        regNo: studentRegNo.trim().toUpperCase(),
        phone: studentPhone?.trim() || null,
      })
    );

    const count = await prisma.malkiaCase.count();
    const caseNumber = `C-${String(count + 1).padStart(4, '0')}`;

    const malkiaCase = await prisma.malkiaCase.create({
      data: {
        caseNumber,
        subGroupId,
        studentIdentifierHash,
        encryptedStudentData,
        needCategory,
        requestedAmountMinor,
        justification,
        hasConsent,
        state: 'DRAFT',
        createdByUserId,
      },
    });

    await prisma.caseEvent.create({
      data: {
        caseId: malkiaCase.id,
        fromState: 'NONE',
        toState: 'DRAFT',
        actorUserId: createdByUserId,
        notes: 'Case draft created.',
      },
    });

    return malkiaCase;
  }

  async submitCase(caseId, actorUserId) {
    const malkiaCase = await prisma.malkiaCase.findUnique({
      where: { id: caseId },
    });
    if (!malkiaCase) throw new ConflictError(`Case "${caseId}" not found.`);
    assertState(malkiaCase.state, ['DRAFT'], 'Case');

    const updated = await prisma.malkiaCase.update({
      where: { id: caseId },
      data: { state: 'SUBMITTED' },
    });

    await prisma.caseEvent.create({
      data: {
        caseId,
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        actorUserId,
        notes: 'Case submitted to committee.',
      },
    });

    await prisma.outboxEvent.create({
      data: {
        eventName: 'case.submitted',
        aggregateType: 'CASE',
        aggregateId: caseId,
        idempotencyKey: `case-submitted-${caseId}`,
        payload: {
          caseId,
          caseNumber: updated.caseNumber,
          subGroupId: updated.subGroupId,
          needCategory: updated.needCategory,
          requestedAmountMinor: updated.requestedAmountMinor.toString(),
          createdAt: Math.floor(updated.createdAt.getTime() / 1000),
        },
      },
    });

    return updated;
  }

  async recordDecision(caseId, { decision, approvedAmount, notes }, actorUserId) {
    const malkiaCase = await prisma.malkiaCase.findUnique({
      where: { id: caseId },
    });
    if (!malkiaCase) throw new ConflictError(`Case "${caseId}" not found.`);

    // Segregation of duties: Submitter cannot approve/decide their own case (Rule R03)
    assertSegregation(
      actorUserId,
      malkiaCase.createdByUserId,
      'Segregation of duties violation: Submitter cannot approve their own case (Rule R03).'
    );

    let nextState;
    let approvedAmountMinor = 0n;

    if (decision === 'APPROVED') {
      assertState(malkiaCase.state, ['SUBMITTED', 'UNDER_REVIEW'], 'Case');
      if (!approvedAmount) {
        throw new ValidationError('Approved amount is required for case approval.');
      }
      approvedAmountMinor = toMinorUnits(approvedAmount, 'KES');
      if (approvedAmountMinor > malkiaCase.requestedAmountMinor) {
        throw new ConflictError('Approved amount cannot exceed the requested amount.');
      }
      nextState = 'APPROVED';
    } else if (decision === 'REJECTED') {
      assertState(malkiaCase.state, ['SUBMITTED', 'UNDER_REVIEW'], 'Case');
      nextState = 'REJECTED';
    } else if (decision === 'NEEDS_INFO') {
      assertState(malkiaCase.state, ['SUBMITTED', 'UNDER_REVIEW'], 'Case');
      nextState = 'NEEDS_INFO';
    } else if (decision === 'UNDER_REVIEW') {
      assertState(malkiaCase.state, ['SUBMITTED', 'NEEDS_INFO'], 'Case');
      nextState = 'UNDER_REVIEW';
    } else {
      throw new ValidationError(`Unknown decision: ${decision}`);
    }

    const [updatedCase] = await prisma.$transaction([
      prisma.malkiaCase.update({
        where: { id: caseId },
        data: {
          state: nextState,
          approvedAmountMinor: nextState === 'APPROVED' ? approvedAmountMinor : malkiaCase.approvedAmountMinor,
        },
      }),
      prisma.caseApproval.create({
        data: {
          caseId,
          approverUserId: actorUserId,
          decision,
          amountMinor: nextState === 'APPROVED' ? approvedAmountMinor : null,
          notes: notes || null,
        },
      }),
      prisma.caseEvent.create({
        data: {
          caseId,
          fromState: malkiaCase.state,
          toState: nextState,
          actorUserId,
          notes: notes || `Decision recorded: ${decision}`,
        },
      }),
    ]);

    await prisma.outboxEvent.create({
      data: {
        eventName: 'case.decided',
        aggregateType: 'CASE',
        aggregateId: caseId,
        idempotencyKey: `case-decided-${caseId}-${Date.now()}`,
        payload: {
          caseId,
          state: nextState,
          approvedAmountMinor: updatedCase.approvedAmountMinor.toString(),
          decidedAt: Math.floor(Date.now() / 1000),
        },
      },
    });

    return updatedCase;
  }

  async authorizeRelease(caseId, { amountMinor, nonce, deadline, signatures }, actorUserId) {
    const malkiaCase = await prisma.malkiaCase.findUnique({
      where: { id: caseId },
    });
    if (!malkiaCase) throw new ConflictError(`Case "${caseId}" not found.`);
    assertState(malkiaCase.state, ['APPROVED'], 'Case');

    if (!signatures || signatures.length !== 2) {
      throw new ValidationError('2 valid signatory signatures are required for release authorization.');
    }
    if (signatures[0].toLowerCase() === signatures[1].toLowerCase()) {
      throw new ConflictError('Signatures must come from two distinct signatories.');
    }

    const updated = await prisma.malkiaCase.update({
      where: { id: caseId },
      data: { state: 'AUTHORIZED' },
    });

    await prisma.caseEvent.create({
      data: {
        caseId,
        fromState: 'APPROVED',
        toState: 'AUTHORIZED',
        actorUserId,
        notes: `2-of-3 signatures collected and authorized. Amount: ${amountMinor}.`,
        payload: { signatures, nonce, deadline },
      },
    });

    await prisma.outboxEvent.create({
      data: {
        eventName: 'case.authorized',
        aggregateType: 'CASE',
        aggregateId: caseId,
        idempotencyKey: `case-authorized-${caseId}`,
        payload: {
          caseId,
          amountMinor: amountMinor.toString(),
          signatures,
          nonce,
          deadline,
        },
      },
    });

    return updated;
  }

  async disburse(caseId, { amount, method, methodReference, evidenceCid, evidenceHash, notes }, actorUserId) {
    const malkiaCase = await prisma.malkiaCase.findUnique({
      where: { id: caseId },
    });
    if (!malkiaCase) throw new ConflictError(`Case "${caseId}" not found.`);
    assertState(malkiaCase.state, ['AUTHORIZED', 'DISBURSED'], 'Case');

    const amountMinor = toMinorUnits(amount, 'KES');
    const newTotalDisbursed = malkiaCase.disbursedAmountMinor + amountMinor;

    // Rule R02: Disbursement larger than authorized amount is strictly rejected
    if (newTotalDisbursed > malkiaCase.approvedAmountMinor) {
      throw new ConflictError(
        `Disbursement amount (${newTotalDisbursed}) exceeds approved authorized amount (${malkiaCase.approvedAmountMinor}).`
      );
    }

    // Allocate from FIFO lots
    const allocationResult = await lotsService.allocateFundsFifo(caseId, amountMinor, malkiaCase.needCategory);

    const updatedCase = await prisma.malkiaCase.update({
      where: { id: caseId },
      data: {
        state: 'DISBURSED',
        disbursedAmountMinor: newTotalDisbursed,
      },
    });

    await prisma.caseEvent.create({
      data: {
        caseId,
        fromState: malkiaCase.state,
        toState: 'DISBURSED',
        actorUserId,
        notes: `Disbursement of KES ${amount} via ${method} (Ref: ${methodReference}). ${notes || ''}`.trim(),
        payload: {
          method,
          methodReference,
          evidenceCid,
          evidenceHash,
          amountMinor: amountMinor.toString(),
        },
      },
    });

    await prisma.outboxEvent.create({
      data: {
        eventName: 'disbursement.recorded',
        aggregateType: 'CASE',
        aggregateId: caseId,
        idempotencyKey: `disbursement-${caseId}-${Date.now()}`,
        payload: {
          caseId,
          amountMinor: amountMinor.toString(),
          method,
          methodReference,
          evidenceCid: evidenceCid || '',
          evidenceHash: evidenceHash || '0x' + '00'.repeat(32),
          disbursedAt: Math.floor(Date.now() / 1000),
        },
      },
    });

    return {
      case: updatedCase,
      allocations: allocationResult.allocations,
    };
  }

  async getCase(caseId, includePii = false) {
    const malkiaCase = await prisma.malkiaCase.findUnique({
      where: { id: caseId },
      include: {
        subGroup: true,
        events: { orderBy: { createdAt: 'desc' } },
        approvals: true,
        allocations: { include: { lot: true } },
      },
    });
    if (!malkiaCase) return null;

    let student = null;
    if (includePii && malkiaCase.encryptedStudentData) {
      try {
        student = JSON.parse(decryptString(malkiaCase.encryptedStudentData));
      } catch {
        student = null;
      }
    }

    return {
      ...malkiaCase,
      student,
      encryptedStudentData: undefined, // Never expose raw encrypted blob
    };
  }

  async listCases({ subGroupId, state, page = 1, pageSize = 20 }) {
    const where = {
      ...(subGroupId ? { subGroupId } : {}),
      ...(state ? { state } : {}),
    };

    const cases = await prisma.malkiaCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { subGroup: true },
    });

    return cases.map((c) => ({
      ...c,
      encryptedStudentData: undefined,
    }));
  }
}

export const casesService = new CasesService();
export default casesService;

