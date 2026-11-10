'use strict';

import { z } from 'zod';

export const createItemDonationSchema = z.object({
  category: z.string().trim().min(2).max(64),
  itemName: z.string().trim().min(2).max(120),
  quantity: z.coerce.number().int().positive(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'USABLE']).default('NEW'),
  estimatedValue: z.union([z.number().nonnegative(), z.string().trim()]).optional(),
  photoUrl: z.string().url().optional(),
  donorLabel: z.string().trim().max(120).optional(),
});

export const issueInventorySchema = z.object({
  caseId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().trim().max(500).optional(),
});

