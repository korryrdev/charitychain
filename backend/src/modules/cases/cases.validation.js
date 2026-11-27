'use strict';

import { z } from 'zod';
import { STUDENT_REG_NO_REGEX } from '../auth/auth.validation.js';

export const createCaseSchema = z.object({
  subGroupId: z.string().uuid(),
  studentName: z.string().trim().min(2).max(120),
  studentRegNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      STUDENT_REG_NO_REGEX,
      'Use a valid university registration number (format: CTxxx/xxxxxx/yy).'
    ),
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
    chainId: z.number().int().positive().optional(),
    verifyingContract: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    signatures: z.array(z.string().regex(/^0x[a-fA-F0-9]{130}$/)).min(1).max(2).optional(),
    signer: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/).optional(),
    signMethod: z.enum(['METAMASK_EIP712']).optional()
  })
  .refine(
    (value) => (Array.isArray(value.signatures) && value.signatures.length >= 2) || (value.signer && value.signature),
    'Either 2 signatures or a signer address with a valid 65-byte EIP-712 signature is required.'
  );

export const uploadCaseEvidenceSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(120),
  base64Content: z.string().min(4).max(8_000_000),
  notes: z.string().trim().max(500).optional(),
});

export const recordDisbursementSchema = z.object({
  amount: z.union([z.number().positive(), z.string().trim()]),
  method: z.enum(['MPESA', 'BANK', 'CASH', 'DIRECT_INSTITUTION', 'ITEMS']),
  methodReference: z.string().trim().min(2).max(100),
  evidenceCid: z.string().trim().optional(),
  evidenceHash: z.string().regex(/^0x[a-f0-9]{64}$/).optional(),
  notes: z.string().trim().max(1000).optional(),
});

