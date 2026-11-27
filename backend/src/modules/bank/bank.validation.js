'use strict';

import { z } from 'zod';

export const createBankDepositSchema = z.object({
  depositReference: z.string().trim().min(3).max(64),
  donorIdentity: z.string().trim().min(2).max(128),
  amount: z.union([z.number().positive(), z.string().trim()]),
  currency: z.string().trim().length(3).default('KES'),
  fxRate: z.number().positive().optional(),
  consentVersion: z.string().trim().min(1).default('v1.0'),
  earmark: z.enum(['FEES', 'UPKEEP', 'MEDICAL', 'EMERGENCY', 'BOOKS']).optional(),
});

export const verifyBankDepositSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  earmark: z.enum(['FEES', 'UPKEEP', 'MEDICAL', 'EMERGENCY', 'BOOKS']).optional(),
});

export const importCsvSchema = z.object({
  csv: z.string().min(5),
});
