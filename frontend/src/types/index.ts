export type Channel = 'MPESA' | 'BANK' | 'IN_KIND';

export type CaseState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_INFO'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTHORIZED'
  | 'DISBURSED'
  | 'CLOSED';

export type UserRole =
  | 'DONOR'
  | 'SUBGROUP_REP'
  | 'COMMITTEE'
  | 'TREASURER'
  | 'SIGNATORY'
  | 'CUSTODIAN'
  | 'AUDITOR'
  | 'ADMIN';

export type NeedCategory =
  | 'FEES'
  | 'UPKEEP'
  | 'MEDICAL'
  | 'EMERGENCY'
  | 'BOOKS';

export type DisplayMode = 'ANONYMOUS' | 'ALIAS' | 'NAMED';

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PATRON' | 'CONSISTENT';

export interface Allocation {
  id: string;
  caseId: string;
  caseNumber: string;
  caseCategory: NeedCategory;
  amountMinor: number;
  allocatedAt: string;
}

export interface DonationTrace {
  id: string;
  receiptCode: string;
  sourceRef: string;
  channel: Channel;
  amountMinor: number;
  currency: string;
  recordedAt: string;
  status: 'RECEIVED' | 'POOLED' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED';
  earmark?: NeedCategory;
  txHash?: string;
  blockNumber?: number;
  allocations: Allocation[];
  recordHash: string;
  donorDisplayMode: DisplayMode;
  donorAlias?: string;
  donorBadge?: BadgeTier;
}

export interface CaseRecord {
  id: string;
  caseNumber: string;
  subGroupId: string;
  subGroupName: string;
  needCategory: NeedCategory;
  requestedAmountMinor: number;
  approvedAmountMinor?: number;
  disbursedAmountMinor?: number;
  state: CaseState;
  justification: string;
  signatorySignatures: {
    signer: string;
    signedAt: string;
  }[];
  submitterId: string;
  evidenceCid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForensicAlert {
  id: string;
  ruleId: string;
  ruleTitle: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0 to 100
  why: string;
  subjectKind: 'donation' | 'case' | 'disbursement' | 'user' | 'pool' | 'day';
  subjectId: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface TransparencyStats {
  totalInflowMinor: number;
  totalOutflowMinor: number;
  activePoolBalanceMinor: number;
  totalBeneficiariesHelped: number;
  totalDonationsCount: number;
  totalCasesDisbursed: number;
  openAlertsCount: number;
  categoryBreakdown: {
    category: NeedCategory;
    amountMinor: number;
    count: number;
  }[];
  channelBreakdown: {
    channel: Channel;
    amountMinor: number;
    count: number;
  }[];
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletAddress?: string;
}

