export const en = {
  // Common
  appName: 'CharityChain',
  tagline: 'Malkia Public Ledger',
  bannerNotice:
    'Malkia Tamper-Proof Ledger: Funds stay on verified M-Pesa & Bank rails; records anchored on Polygon Amoy.',
  themeLight: 'Light Mode',
  themeDark: 'Dark Mode',
  signOut: 'Sign Out',
  staffPortal: 'Committee & Signatories',
  staff: 'Staff',
  anonymous: 'Anonymous Giver',
  verifyOnChain: 'Verify on Polygon Amoy',
  searching: 'Searching...',
  reset: 'Reset',
  filter: 'Filter',
  report: 'Report',
  dismiss: 'Dismiss',

  // Navigation
  navTrace: 'Trace Donation',
  navDashboard: 'Transparency Dashboard',
  navWall: 'Recognition Wall',
  navReports: 'Anchored Reports',

  // Internal Navigation
  navCases: 'Cases & Approvals',
  navNewCase: 'Submit New Case',
  navSigning: '2-of-3 Release Queue',
  navDonations: 'Bank Deposits & Verification',
  navPharmacy: 'Pharmacy Quick Item Log',
  navGraph: 'Fund Flow Network Graph',
  navAlerts: 'Forensic Alert Inbox',
  navReportBuilder: 'Quarterly Report Builder',

  // Trace Page
  traceTitle: 'Trace Your Donation',
  traceSubtitle:
    'Enter your receipt code to verify your contribution’s journey from intake to needy student disbursements.',
  tracePlaceholder: 'e.g. MLK-7F3K-92QD or M-Pesa Code',
  traceButton: 'Trace Lot',
  quickSamples: 'Quick sample receipts:',
  receiptNotFound: 'Receipt Not Found',
  receiptNotFoundDesc:
    'We couldn’t locate a verified donation with this code. Please check your M-Pesa confirmation or receipt.',
  receiptCode: 'Receipt Code',
  donorRecognition: 'Donor Recognition',
  railChannel: 'Rail Channel',
  recordedTime: 'Recorded (EAT)',
  sourceReference: 'Payment Source Ref',
  onChainAnchor: 'Polygon Amoy Anchor',
  allocationsBreakdown: 'Needy Student Case Allocations',
  unallocatedPool: 'Remaining in Unallocated Pool',

  // Recognition Wall
  wallTitle: 'Public Recognition Wall',
  wallSubtitle:
    'Celebrating donors and alumni whose gifts sustain students in need. Every badge is deterministically computed from verified on-chain lots.',
  wallPrivacyNotice:
    'In compliance with Kenya Data Protection Act 2019 and PRD Rule FR-DON-12, individual donation amounts and transaction dates are never disclosed on this recognition wall.',
  claimReceiptCta: 'Claim Receipt & Set Name',
  anonymousSupporters: 'Anonymous Supporters',
  anonymousDesc: 'Contributing quietly without public recognition. Every cent still fully tracked on the public ledger.',

  // Dashboard
  dashTitle: 'Malkia Transparency Dashboard',
  dashSubtitle:
    'Real-time financial integrity metrics for the campus emergency bursary pool. Every shilling reconciles against Polygon Amoy cryptographic proofs.',
  totalInflow: 'Total Inflow (M-Pesa & Bank)',
  totalOutflow: 'Total Disbursed to Students',
  poolBalance: 'Active Pool Balance',
  beneficiariesHelped: 'Needy Students Assisted',
  donationsCount: 'Verified Donation Lots',
  disbursedCasesCount: 'Cases Fully Disbursed',

  // Footer
  copyright: '© 2026 Malkia Campus Charity. Registered Student & Staff Support Group.',
  browserRpc: 'Independent Browser-to-RPC Verification',
  zeroPii: 'Zero PII On-Chain (HMAC-SHA256)',
};

export type TranslationKey = keyof typeof en;

