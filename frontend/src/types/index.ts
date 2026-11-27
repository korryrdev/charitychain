export * from './portal';

export type Channel = 'MPESA' | 'BANK' | 'IN_KIND' | 'CRYPTO';

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
  | 'STUDENT'
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
  lotId?: string;
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
  riskScore: number;
  why: string;
  subjectKind: 'donation' | 'case' | 'disbursement' | 'user' | 'pool' | 'day' | 'system';
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
  token?: string;
}

export interface RecognitionEntry {
  id: string;
  displayName: string;
  displayMode: 'ALIAS' | 'NAMED';
  tier: BadgeTier;
  awardedMonth: string;
  isConsistentGiver?: boolean;
}

export interface DonorClaimProfile {
  receiptCode: string;
  donorRef: string;
  cumulativeMinor: number;
  activeTier: BadgeTier;
  nextTier?: BadgeTier;
  nextTierThresholdMinor?: number;
  consecutiveMonthsCount: number;
  isConsistentGiver: boolean;
  displayMode: DisplayMode;
  displayName: string;
}

export interface BankDeposit {
  id: string;
  depositReference: string;
  donorRef: string;
  amountMinor: number;
  currency: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  enteredByUserId: string;
  verifiedByUserId?: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface QuarterlyReport {
  id: string;
  year: number;
  quarter: number;
  version: number;
  reportHash: string;
  periodRoot: string;
  canonicalJson: any;
  createdAt: string;
}

export interface UploadedCaseEvidence {
  evidenceCid: string;
  evidenceHash: string;
  size: number;
  pinnedAt: string;
}

export interface BenfordDigitStat {
  observed: number;
  expected: number;
  observedPct: number;
  expectedPct: number;
}

export interface BenfordSampleResult {
  isAnomalous: boolean;
  sampleSize: number;
  chiSquare: number;
  criticalValue?: number;
  distribution?: Record<string, BenfordDigitStat>;
}

export interface BenfordAnalysisResponse {
  disbursements: BenfordSampleResult;
  donations: BenfordSampleResult;
  combined: BenfordSampleResult;
  criticalValue: number;
  expectedDistribution: { digit: number; expectedPct: number }[];
}

export interface ForensicRuleConfig {
  id: string;
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  isEnabled: boolean;
  phase?: number;
  thresholdParams?: Record<string, any> | null;
}

export interface BankReconciliationReport {
  matchedCount: number;
  unmatchedStatementCount: number;
  unmatchedDepositCount: number;
  matched: { statementLineId: string; depositId: string }[];
  unmatchedStatementLines: {
    id: string;
    reference: string;
    amountMinor: string;
    statementDate: string;
  }[];
  unmatchedLedgerDeposits: {
    id: string;
    reference: string;
    amountMinor: string;
    createdAt: string;
  }[];
}
