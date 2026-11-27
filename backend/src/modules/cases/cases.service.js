'use strict';

import { createHash } from 'node:crypto';
import Web3 from 'web3';
import { prisma } from '@charitychain/database';
import { toMinorUnits } from '../../utils/money.js';
import { canonicalJson } from '../../utils/canonicalJson.js';
import { encryptString, decryptString, blindIndex } from '../../security/encryption.js';
import { assertSegregation, assertState } from '../../utils/assertions.js';
import { lotsService } from '../lots/lots.service.js';
import { evidenceEncryptionService } from '../evidence/evidenceEncryption.service.js';
import { uploadToIpfs } from '../../integrations/ipfs/ipfsUploader.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ValidationError } from '../../errors/ValidationError.js';

const web3Instance = new Web3();
const EIP712_DOMAIN_TYPEHASH = Web3.utils.keccak256(
  'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
);
const RELEASE_AUTH_TYPEHASH = Web3.utils.keccak256(
  'ReleaseAuthorization(bytes32 caseId,uint64 amountMinor,uint64 nonce,uint64 deadline)'
);
const CASE_WORKFLOW_NAME_HASH = Web3.utils.keccak256('CharityChain CaseWorkflow');
const CASE_WORKFLOW_VERSION_HASH = Web3.utils.keccak256('1');
const DEFAULT_VERIFYING_CONTRACT =
  process.env.CASE_WORKFLOW_ADDRESS || '0x0000000000000000000000000000000000000001';

export function computeReleaseAuthDigest({
  caseId,
  amountMinor,
  nonce = 0,
  deadline,
  chainId = Number(process.env.CHAIN_ID || 80002),
  verifyingContract = DEFAULT_VERIFYING_CONTRACT,
}) {
  const caseIdBytes32 = Web3.utils.keccak256(`malkia:v1:case:${String(caseId).toLowerCase()}`);
  const domainSeparator = Web3.utils.keccak256(
    web3Instance.eth.abi.encodeParameters(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        EIP712_DOMAIN_TYPEHASH,
        CASE_WORKFLOW_NAME_HASH,
        CASE_WORKFLOW_VERSION_HASH,
        BigInt(chainId),
        verifyingContract,
      ]
    )
  );
  const structHash = Web3.utils.keccak256(
    web3Instance.eth.abi.encodeParameters(
      ['bytes32', 'bytes32', 'uint64', 'uint64', 'uint64'],
      [RELEASE_AUTH_TYPEHASH, caseIdBytes32, BigInt(amountMinor), BigInt(nonce), BigInt(deadline)]
    )
  );
  return Web3.utils.keccak256(`0x1901${domainSeparator.slice(2)}${structHash.slice(2)}`);
}

export function recoverReleaseSigner(digest, signature) {
  try {
    return web3Instance.eth.accounts.recover(digest, signature, true);
  } catch {
    throw new ValidationError('Invalid EIP-712 release authorization signature.');
  }
}

function extractCaseMetadata(events = []) {
  const ordered = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const signatorySignatures = [];
  let evidenceCid;

  for (const ev of ordered) {
    if (ev.toState === 'APPROVED' && ev.payload?.signer) {
      const addr = String(ev.payload.signer);
      if (!signatorySignatures.some((s) => s.signer.toLowerCase() === addr.toLowerCase())) {
        signatorySignatures.push({ signer: addr, signedAt: ev.createdAt });
      }
    } else if (ev.toState === 'AUTHORIZED' && Array.isArray(ev.payload?.signers)) {
      for (const addr of ev.payload.signers) {
        if (addr && !signatorySignatures.some((s) => s.signer.toLowerCase() === String(addr).toLowerCase())) {
          signatorySignatures.push({ signer: String(addr), signedAt: ev.createdAt });
        }
      }
    }
    if (ev.payload?.evidenceCid) {
      evidenceCid = String(ev.payload.evidenceCid);
    }
  }

  return { signatorySignatures, evidenceCid };
}

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

  async authorizeRelease(
    caseId,
    {
      amountMinor,
      nonce = 0,
      deadline,
      chainId,
      verifyingContract,
      signatures,
      signer,
      signature,
      signMethod,
    },
    actorUserId
  ) {
    const malkiaCase = await prisma.malkiaCase.findUnique({
      where: { id: caseId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!malkiaCase) throw new ConflictError(`Case "${caseId}" not found.`);
    assertState(malkiaCase.state, ['APPROVED'], 'Case');

    const effectiveAmountMinor = amountMinor ?? malkiaCase.approvedAmountMinor;
    const effectiveDeadline = deadline ?? Math.floor(Date.now() / 1000) + 7 * 86400;
    if (Number(effectiveDeadline) <= Math.floor(Date.now() / 1000)) {
      throw new ValidationError('Release authorization signature has expired.');
    }

    const effectiveChainId = chainId ?? Number(process.env.CHAIN_ID || 80002);
    const effectiveVerifyingContract = verifyingContract ?? DEFAULT_VERIFYING_CONTRACT;
    const digest = computeReleaseAuthDigest({
      caseId,
      amountMinor: effectiveAmountMinor,
      nonce,
      deadline: effectiveDeadline,
      chainId: effectiveChainId,
      verifyingContract: effectiveVerifyingContract,
    });

    let finalSignatures = signatures;
    let finalSigners = [];

    if (!finalSignatures || finalSignatures.length < 2) {
      if (!signer || !signature) {
        throw new ValidationError('2 valid signatory signatures are required for release authorization.');
      }
      const recovered = recoverReleaseSigner(digest, signature);
      if (recovered.toLowerCase() !== signer.toLowerCase()) {
        throw new ValidationError('EIP-712 signature does not match the claimed signatory wallet address.');
      }

      const normalizedSigner = recovered.toLowerCase();
      const priorEvents = malkiaCase.events.filter(
        (e) => e.fromState === 'APPROVED' && e.toState === 'APPROVED' && e.payload?.signer
      );
      if (priorEvents.some((e) => String(e.payload.signer).toLowerCase() === normalizedSigner)) {
        throw new ConflictError('This signatory wallet has already signed release authorization for this case.');
      }
      if (priorEvents.length === 0) {
        await prisma.caseEvent.create({
          data: {
            caseId,
            fromState: 'APPROVED',
            toState: 'APPROVED',
            actorUserId,
            notes: `EIP-712 release signature 1 of 2 collected from ${recovered}.`,
            payload: {
              signer: recovered,
              signature,
              signMethod: signMethod || 'METAMASK_EIP712',
              nonce,
              deadline: effectiveDeadline,
              chainId: effectiveChainId,
              verifyingContract: effectiveVerifyingContract,
            },
          },
        });
        return this.getCase(caseId, false);
      }

      const firstSig = priorEvents[0].payload.signature;
      finalSignatures = [firstSig, signature];
      finalSigners = [priorEvents[0].payload.signer, recovered];
    } else {
      const recovered1 = recoverReleaseSigner(digest, finalSignatures[0]);
      const recovered2 = recoverReleaseSigner(digest, finalSignatures[1]);
      if (recovered1.toLowerCase() === recovered2.toLowerCase()) {
        throw new ConflictError('Signatures must come from two distinct signatories.');
      }
      finalSigners = [recovered1, recovered2];
    }

    if (finalSignatures.length !== 2) {
      throw new ValidationError('2 valid signatory signatures are required for release authorization.');
    }
    if (finalSignatures[0].toLowerCase() === finalSignatures[1].toLowerCase()) {
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
        notes: `2-of-3 signatures collected and authorized. Amount: ${effectiveAmountMinor}.`,
        payload: {
          signatures: finalSignatures,
          signers: finalSigners,
          signMethod: signMethod || 'METAMASK_EIP712',
          nonce,
          deadline: effectiveDeadline,
          chainId: effectiveChainId,
          verifyingContract: effectiveVerifyingContract,
        },
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
          amountMinor: effectiveAmountMinor.toString(),
          signatures: finalSignatures,
          signers: finalSigners,
          nonce,
          deadline: effectiveDeadline,
        },
      },
    });

    return updated;
  }

  async uploadEvidence(
    caseId,
    { filename, mimeType, base64Content, notes },
    actorUserId,
    { uploader = uploadToIpfs, encryption = evidenceEncryptionService } = {}
  ) {
    const malkiaCase = await prisma.malkiaCase.findUnique({ where: { id: caseId } });
    if (!malkiaCase) throw new ConflictError(`Case "${caseId}" not found.`);
    assertState(malkiaCase.state, ['AUTHORIZED', 'DISBURSED'], 'Case');

    const canonical = canonicalJson({
      caseId: malkiaCase.id,
      caseNumber: malkiaCase.caseNumber,
      filename,
      mimeType,
      base64Content,
      notes: notes || null,
      uploadedByUserId: actorUserId,
      uploadedAt: new Date().toISOString(),
    });
    const evidenceHash = `0x${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
    const encrypted = encryption.encrypt(canonical, evidenceHash);
    const envelope = { ...encrypted, digest: evidenceHash };

    let uploaded;
    try {
      uploaded = await uploader(
        JSON.stringify(envelope),
        `${malkiaCase.caseNumber.toLowerCase()}-evidence.enc.json`
      );
    } catch (error) {
      throw new AppError({
        message: 'Encrypted evidence could not be pinned to IPFS.',
        code: ERROR_CODES.INTEGRATION_UNAVAILABLE,
        statusCode: 503,
        cause: error,
      });
    }

    return {
      evidenceCid: uploaded.cid,
      evidenceHash,
      size: uploaded.size,
      pinnedAt: new Date().toISOString(),
    };
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
      ...extractCaseMetadata(malkiaCase.events),
      student,
      encryptedStudentData: undefined, // Never expose raw encrypted blob
    };
  }

  async listSubgroups() {
    return prisma.subgroup.findMany({ orderBy: { name: 'asc' } });
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
      include: {
        subGroup: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return cases.map((c) => ({
      ...c,
      ...extractCaseMetadata(c.events),
      encryptedStudentData: undefined,
    }));
  }
}

export const casesService = new CasesService();
export default casesService;

