'use strict';

import { z } from 'zod';

export const createCaseSchema = z.object({
  subGroupId: z.string().uuid(),
  studentName: z.string().trim().min(2).max(120),
  studentRegNo: z.string().trim().min(3).max(64),
  studentPhone: z.string().trim().optional(),
  needCategory: z.enum(['FEES', 'UPKEEP', 'MEDICAL', 'EMERGENCY', 'BOOKS']),
  requestedAmount: z.union([z.number().positive(), z.string().trim()]),
  justification: z.string().trim().min(10).max(2000),
  hasConsent: z.boolean().default(true),
});

export const caseDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'NEEDS_INFO', 'UNDER_REVIEW']),
  approvedAmount: z.union([z.number().positive(), z.string().trim()]).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const authorizeReleaseSchema = z
  .object({
    amountMinor: z.union([z.number().positive(), z.string().trim()]).optional(),
    nonce: z.number().int().nonnegative().default(0),
    deadline: z.number().int().positive().optional(),
    signatures: z.array(z.string().regex(/^0x[a-fA-F0-9]{130}$/)).min(1).max(2).optional(),
    signer: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/).optional(),
    signMethod: z.enum(['METAMASK_EIP712', 'DEMO_SIGNATORY']).optional()
  })
  .refine(
    (value) => (Array.isArray(value.signatures) && value.signatures.length >= 2) || (value.signer && value.signature),
    'Either 2 signatures or a signer address with a valid 65-byte EIP-712 signature is required.'
  );

export const recordDisbursementSchema = z.object({
  amount: z.union([z.number().positive(), z.string().trim()]),
  method: z.enum(['MPESA', 'BANK', 'CASH', 'DIRECT_INSTITUTION', 'ITEMS']),
  methodReference: z.string().trim().min(2).max(100),
  evidenceCid: z.string().trim().optional(),
  evidenceHash: z.string().regex(/^0x[a-f0-9]{64}$/).optional(),
  notes: z.string().trim().max(1000).optional(),
});

