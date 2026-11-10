'use strict';

import { z } from 'zod';

export const darajaC2bPayloadSchema = z.object({
  TransactionType: z.string().optional(),
  TransID: z.string().min(1, 'TransID is required'),
  TransTime: z.string().optional(),
  TransAmount: z.union([z.string(), z.number()]),
  BusinessShortCode: z.string().optional(),
  BillRefNumber: z.string().optional(),
  InvoiceNumber: z.string().optional(),
  OrgAccountBalance: z.string().optional(),
  ThirdPartyTransID: z.string().optional(),
  MSISDN: z.string().optional(),
  FirstName: z.string().optional(),
  MiddleName: z.string().optional(),
  LastName: z.string().optional(),
}).passthrough();

