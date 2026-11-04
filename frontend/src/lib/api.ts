import type {
  DonationTrace,
  CaseRecord,
  ForensicAlert,
  TransparencyStats,
  UserSession,
  NeedCategory,
} from '@/types';

// Mock seed data matching PRD specifications
const MOCK_DONATIONS: Record<string, DonationTrace> = {
  'MLK-7F3K-92QD': {
    id: 'd1-92qd',
    receiptCode: 'MLK-7F3K-92QD',
    sourceRef: 'SGK894K201', // M-Pesa ref
    channel: 'MPESA',
    amountMinor: 50000, // KES 500.00
    currency: 'KES',
    recordedAt: '2026-10-14T08:23:10Z',
    status: 'FULLY_ALLOCATED',
    txHash: '0x3a4b9c1d2e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef',
    blockNumber: 4218902,
    recordHash: '0x8f72a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc',
    donorDisplayMode: 'ALIAS',
    donorAlias: 'Wanjiku M.',
    donorBadge: 'BRONZE',
    allocations: [
      {
        id: 'alloc-1',
        caseId: 'case-0142',
        caseNumber: 'CASE-2026-0142',
        caseCategory: 'FEES',
        amountMinor: 35000, // KES 350.00
        allocatedAt: '2026-10-16T11:00:00Z',
      },
      {
        id: 'alloc-2',
        caseId: 'case-0143',
        caseNumber: 'CASE-2026-0143',
        caseCategory: 'BOOKS',
        amountMinor: 15000, // KES 150.00
        allocatedAt: '2026-10-18T14:30:00Z',
      },
    ],
  },
  'MLK-4B2N-88LK': {
    id: 'd2-88lk',
    receiptCode: 'MLK-4B2N-88LK',
    sourceRef: 'BANK-TRF-9021',
    channel: 'BANK',
    amountMinor: 250000, // KES 2,500.00
    currency: 'KES',
    recordedAt: '2026-10-20T10:15:00Z',
    status: 'PARTIALLY_ALLOCATED',
    earmark: 'MEDICAL',
    txHash: '0x7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
    blockNumber: 4220150,
    recordHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    donorDisplayMode: 'ANONYMOUS',
    donorBadge: 'SILVER',
    allocations: [
      {
        id: 'alloc-3',
        caseId: 'case-0145',
        caseNumber: 'CASE-2026-0145',
        caseCategory: 'MEDICAL',
        amountMinor: 120000, // KES 1,200.00
        allocatedAt: '2026-10-22T09:45:00Z',
      },
    ],
  },
  'MLK-99ZZ-31AA': {
    id: 'd3-31aa',
    receiptCode: 'MLK-99ZZ-31AA',
    sourceRef: 'PHARM-ITEM-042',
    channel: 'IN_KIND',
    amountMinor: 15, // 15 physical textbook items
    currency: 'ITM',
    recordedAt: '2026-10-25T13:40:00Z',
    status: 'POOLED',
    earmark: 'BOOKS',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: 4221500,
    recordHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    donorDisplayMode: 'NAMED',
    donorAlias: 'Alumni Association Class of 2022',
    donorBadge: 'GOLD',
    allocations: [],
  },
};

const MOCK_CASES: CaseRecord[] = [
  {
    id: 'case-0142',
    caseNumber: 'CASE-2026-0142',
    subGroupId: 'sub-eng',
    subGroupName: 'Engineering Students Sub-group',
    needCategory: 'FEES',
    requestedAmountMinor: 450000, // KES 4,500.00
    approvedAmountMinor: 450000,
    disbursedAmountMinor: 450000,
    state: 'DISBURSED',
    justification: 'Emergency tuition top-up for 3rd year student facing end-of-semester exam lockout.',
    signatorySignatures: [
      { signer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', signedAt: '2026-10-15T14:10:00Z' },
      { signer: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', signedAt: '2026-10-15T15:20:00Z' },
    ],
    submitterId: 'rep-eng-01',
    createdAt: '2026-10-14T09:00:00Z',
    updatedAt: '2026-10-16T11:00:00Z',
  },
  {
    id: 'case-0145',
    caseNumber: 'CASE-2026-0145',
    subGroupId: 'sub-med',
    subGroupName: 'Health Sciences Sub-group',
    needCategory: 'MEDICAL',
    requestedAmountMinor: 300000, // KES 3,000.00
    approvedAmountMinor: 250000, // KES 2,500.00
    state: 'APPROVED',
    justification: 'Prescription medication and outpatient laboratory diagnostics at university hospital pharmacy.',
    signatorySignatures: [
      { signer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', signedAt: '2026-10-21T16:00:00Z' },
    ], // Needs 1 more signatory! (1 of 2 signatures)
    submitterId: 'rep-med-02',
    createdAt: '2026-10-19T10:30:00Z',
    updatedAt: '2026-10-21T16:00:00Z',
  },
  {
    id: 'case-0146',
    caseNumber: 'CASE-2026-0146',
    subGroupId: 'sub-bus',
    subGroupName: 'Business Students Sub-group',
    needCategory: 'UPKEEP',
    requestedAmountMinor: 150000, // KES 1,500.00
    state: 'SUBMITTED',
    justification: 'Food basket and meal stipend voucher for orphaned 1st year student awaiting bursary allocation.',
    signatorySignatures: [],
    submitterId: 'rep-bus-01',
    createdAt: '2026-10-26T11:15:00Z',
    updatedAt: '2026-10-26T11:15:00Z',
  },
];

const MOCK_ALERTS: ForensicAlert[] = [
  {
    id: 'alert-01',
    ruleId: 'R10',
    ruleTitle: 'Signatory Concentration Risk',
    severity: 'MEDIUM',
    riskScore: 68,
    why: 'Signatories 0x90F7 and 0x15d3 authorized 92% of all disbursements across the last 30 days without Signatory 3.',
    subjectKind: 'user',
    subjectId: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    status: 'OPEN',
    createdAt: '2026-10-24T09:00:00Z',
  },
  {
    id: 'alert-02',
    ruleId: 'R05',
    ruleTitle: 'Pool Dwell Time Warning',
    severity: 'LOW',
    riskScore: 35,
    why: 'Donation lot MLK-4B2N-88LK remaining unallocated exceeds 45 days in pool.',
    subjectKind: 'pool',
    subjectId: 'd2-88lk',
    status: 'OPEN',
    createdAt: '2026-10-25T00:10:00Z',
  },
];

const MOCK_STATS: TransparencyStats = {
  totalInflowMinor: 145000000, // KES 1,450,000.00
  totalOutflowMinor: 121000000, // KES 1,210,000.00
  activePoolBalanceMinor: 24000000, // KES 240,000.00
  totalBeneficiariesHelped: 184,
  totalDonationsCount: 1420,
  totalCasesDisbursed: 172,
  openAlertsCount: 2,
  categoryBreakdown: [
    { category: 'FEES', amountMinor: 78000000, count: 96 },
    { category: 'UPKEEP', amountMinor: 22000000, count: 48 },
    { category: 'MEDICAL', amountMinor: 15000000, count: 22 },
    { category: 'BOOKS', amountMinor: 6000000, count: 6 },
  ],
  channelBreakdown: [
    { channel: 'MPESA', amountMinor: 95000000, count: 1210 },
    { channel: 'BANK', amountMinor: 50000000, count: 180 },
    { channel: 'IN_KIND', amountMinor: 30, count: 30 },
  ],
};

export const api = {
  // Public Trace
  getDonationTrace: async (receiptCode: string): Promise<DonationTrace | null> => {
    await new Promise((r) => setTimeout(r, 400));
    const normalized = receiptCode.trim().toUpperCase();
    return MOCK_DONATIONS[normalized] || null;
  },

  // Public Stats
  getTransparencyStats: async (): Promise<TransparencyStats> => {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_STATS;
  },

  // Cases Queue
  getCases: async (): Promise<CaseRecord[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return [...MOCK_CASES];
  },

  // Create Case
  createCase: async (payload: {
    subGroupId: string;
    subGroupName: string;
    needCategory: NeedCategory;
    requestedAmountMinor: number;
    justification: string;
  }): Promise<CaseRecord> => {
    await new Promise((r) => setTimeout(r, 500));
    const newCase: CaseRecord = {
      id: `case-${Date.now()}`,
      caseNumber: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subGroupId: payload.subGroupId,
      subGroupName: payload.subGroupName,
      needCategory: payload.needCategory,
      requestedAmountMinor: payload.requestedAmountMinor,
      state: 'SUBMITTED',
      justification: payload.justification,
      signatorySignatures: [],
      submitterId: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_CASES.unshift(newCase);
    return newCase;
  },

  // Signatory Sign Action (EIP-712 Release)
  signReleaseAuthorization: async (caseId: string, signerAddress: string): Promise<CaseRecord> => {
    await new Promise((r) => setTimeout(r, 600));
    const target = MOCK_CASES.find((c) => c.id === caseId);
    if (!target) throw new Error('Case not found');

    const alreadySigned = target.signatorySignatures.some((s) => s.signer.toLowerCase() === signerAddress.toLowerCase());
    if (alreadySigned) throw new Error('You have already signed this release.');

    target.signatorySignatures.push({
      signer: signerAddress,
      signedAt: new Date().toISOString(),
    });

    // Check 2-of-3 invariant
    if (target.signatorySignatures.length >= 2) {
      target.state = 'AUTHORIZED';
    }

    return { ...target };
  },

  // Forensic Alerts
  getForensicAlerts: async (): Promise<ForensicAlert[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return [...MOCK_ALERTS];
  },

  // Resolve Alert
  resolveAlert: async (alertId: string, note: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 400));
    const target = MOCK_ALERTS.find((a) => a.id === alertId);
    if (target) {
      target.status = 'RESOLVED';
      target.resolvedAt = new Date().toISOString();
      target.resolutionNote = note;
    }
  },
};

