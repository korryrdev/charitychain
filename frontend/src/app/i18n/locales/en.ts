export const en = {
  // Common
  appName: 'CharityChain',
  skipToMain: 'Skip to main content',
  themeLight: 'Light Mode',
  themeDark: 'Dark Mode',
  signOut: 'Sign Out',
  staff: 'Staff',
  anonymous: 'Anonymous',
  verifyOnChain: 'View audit record',
  searching: 'Searching...',
  reset: 'Reset',
  filter: 'Filter',
  report: 'Report',
  dismiss: 'Dismiss',

  // Public Shell & Navigation
  bannerVerified: 'Public figures are published only after confirmation and reconciliation.',
  navHowItWorks: 'How it works',
  navTrack: 'Track donation',
  navGoods: 'Goods',
  navRecognition: 'Donor recognition',
  navSignIn: 'Sign in',
  navGiveSupport: 'Give support',
  navMyDashboard: 'My dashboard',
  navTrace: 'Track Donation',
  navDashboard: 'Transparency',
  navWall: 'Supporters',
  navReports: 'Reports',

  // Internal Navigation & Portals
  navCases: 'Cases',
  navNewCase: 'New Case',
  navSigning: 'Signing',
  navDonations: 'Donations',
  navPharmacy: 'Pharmacy',
  navGraph: 'Fund Flow',
  navAlerts: 'Alerts',
  navReportBuilder: 'Report Builder',
  portalAdmin: 'Super administration',
  portalStudent: 'Student portal',
  portalOperations: 'Operations portal',
  portalGovernance: 'Governance portal',
  portalDonor: 'Donor portal',

  // Trace Page
  traceTitle: 'Track a Donation',
  tracePlaceholder: 'e.g. MLK-7F3K-92QD or M-Pesa reference',
  traceButton: 'Find Donation',
  quickSamples: 'Sample receipts to explore:',
  receiptNotFound: 'Receipt not found',
  receiptNotFoundDesc: 'Check the code or payment reference and try again.',
  receiptCode: 'Receipt Code',
  donorRecognition: 'Supporter',
  railChannel: 'Payment Method',
  recordedTime: 'Date & Time Received',
  sourceReference: 'Payment Reference',
  onChainAnchor: 'Audit Verification',
  allocationsBreakdown: 'How it was used',
  unallocatedPool: 'Emergency pool',

  // Recognition Wall
  claimReceiptCta: 'Claim Receipt & Set Display Name',
  anonymousSupporters: 'Anonymous Friends',
  wallThankYou: 'Thank You for Your Kindness',
  wallTitle: 'Supporters',
  wallPrivacyNote: 'Amounts and exact dates are never shown',
  wallSetDisplayName: 'Set display name',
  wallSearchPlaceholder: 'Search supporter name...',
  wallReportTitle: 'Report displayed name',

  // Complaints & Fraud
  complaintsTitle: 'Raise a complaint',
  complaintsLead:
    'Submit a complaint or review request for authorized governance inspection. Include dates and safe reference codes only — never include passwords, tracking secrets, or one-time codes.',
  fraudTitle: 'Report suspected fraud & anomalies',
  fraudLead:
    'Report suspected impersonation, altered confirmation records, payment anomalies, inventory misuse, or attempts to obtain private credentials.',

  // Dashboard
  totalInflow: 'Total Contributions (M-Pesa & Bank)',
  totalOutflow: 'Total Delivered to Students',
  poolBalance: 'Current Emergency Pool',
  beneficiariesHelped: 'Students Supported',
  donationsCount: 'Total Gifts Recorded',
  disbursedCasesCount: 'Student Cases Fulfilled',

  // Footer
  footerExplore: 'Explore',
  footerSupport: 'Support',
  footerPolicies: 'Policies',
  footerGovernance: 'Governance',
  footerFaq: 'Frequently asked questions',
  footerHelp: 'Help center & guides',
  footerComplaints: 'Complaints and appeals',
  footerReportFraud: 'Report fraud',
  footerContact: 'Contact and support',
  footerPoliciesLink: 'Policies',
  footerPrivacy: 'Privacy notice',
  footerTagline: 'Transparent, accountable university support for students and staff.',
  footerPaymentNote:
    'Payments are handled through M-Pesa, Paybill, and banks. Public reporting is reconciled and privacy-safe.',
  footerBuiltFor: 'Built for accountable support.',
  copyright: '© 2026 CharityChain',
};

export type TranslationKey = keyof typeof en;
