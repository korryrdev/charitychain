import { NAVIGATION, allowedNavigation } from '../../layouts/navigation.js';

export const FAQ_CATEGORIES = Object.freeze([
  { id: 'ALL', label: 'All topics' },
  { id: 'DONORS', label: 'Donors & tracing' },
  { id: 'STUDENTS', label: 'Students & applications' },
  { id: 'BLOCKCHAIN', label: 'Blockchain & proof' },
  { id: 'GOVERNANCE', label: 'Governance & privacy' }
]);

export const FAQ_ITEMS = Object.freeze([
  {
    id: 'why-blockchain',
    category: 'BLOCKCHAIN',
    question: 'Does CharityChain hold money in smart contracts?',
    answer:
      'No. Money stays in M-Pesa, Paybill, and bank channels. Smart contracts only record tamper-evident fingerprints (hashes), committee release approvals, and daily ledger anchors so anyone can verify that records have not been silently altered.'
  },
  {
    id: 'verified-and-locked',
    category: 'BLOCKCHAIN',
    question: 'What does "Verified and locked" mean on a record?',
    answer:
      'It means the donation, approval, or periodic report digest has been anchored to the audit registry and matches its recorded cryptographic fingerprint. You can inspect the transaction hash and block reference under technical details without needing a crypto wallet.'
  },
  {
    id: 'ipfs-privacy',
    category: 'BLOCKCHAIN',
    question: 'Are student receipts and evidence files readable by the public on IPFS?',
    answer:
      'No. Evidence files that could identify students or personal finances are encrypted before being pinned to IPFS. Only authorised reviewers with the proper permissions can decrypt them; the chain stores only the content identifier and plaintext hash.'
  },
  {
    id: 'track-without-login',
    category: 'DONORS',
    question: 'How do I trace my donation without creating an account?',
    answer:
      'Open Track a donation (/track) and enter both your issued Tracking ID (for example MAL-XXXXXXXXXXXX) and private verification secret. Requiring both credentials and rate-limiting lookups prevents anyone from guessing receipt codes.'
  },
  {
    id: 'confirm-physical-donation',
    category: 'DONORS',
    question: 'Why did I receive an SMS to confirm a physical goods donation?',
    answer:
      'When a clerk logs donated goods or physical cash at a drop-off point, you receive an independent confirmation prompt. Inventory and reconciliation figures update only after you confirm that the recorded items and quantities are accurate.'
  },
  {
    id: 'donor-display-modes',
    category: 'GOVERNANCE',
    question: 'Will my real name appear on the public recognition wall?',
    answer:
      'Never by default. Donors start as Anonymous or with a generated alias. Your public name only appears after you preview and explicitly confirm an Alias or Named display mode, and you can withdraw consent at any time with immediate effect.'
  },
  {
    id: 'recognition-badges',
    category: 'DONORS',
    question: 'How do donor recognition tiers and badges work?',
    answer:
      'Badge tiers (Silver, Gold, Diamond, Platinum) are computed deterministically from your verified contributions after settlement and cooling checks. Badges celebrate generosity and consistency—they never influence vetting scores or student case decisions.'
  },
  {
    id: 'student-email-format',
    category: 'STUDENTS',
    question: 'Why must students sign up and log in with name123456@students.must.ac.ke?',
    answer:
      'The Student portal enforces the official MUST student email pattern (letters followed by six digits before @students.must.ac.ke) so student accounts stay separated from donor, admin, and secretariat accounts and automatically receive the Student role.'
  },
  {
    id: 'student-vetting',
    category: 'STUDENTS',
    question: 'How is student financial need assessed?',
    answer:
      'Eligibility is evaluated using an explainable Need Index grounded in your verified university fee balance, payment history, aid records, and academic status. You do not upload fee statements in the prototype, and every Need Index factor is explained on your vetting screen.'
  },
  {
    id: 'record-discrepancy',
    category: 'STUDENTS',
    question: 'What should I do if my university fee or aid record looks wrong?',
    answer:
      'Open your University Record or Appeals page (/student/appeals) and submit a discrepancy report describing what differs. Your record is read-only from the student portal, and corrections are logged as new audited entries rather than silent edits.'
  },
  {
    id: 'two-of-three-approval',
    category: 'GOVERNANCE',
    question: 'Can one administrator or committee member release funds alone?',
    answer:
      'No. Segregation of duties is enforced in code. The person who submits or verifies an entry cannot approve it alone, and fund releases require distinct two-of-three committee signatory approvals before finance can execute a payout.'
  },
  {
    id: 'goods-collection-limits',
    category: 'STUDENTS',
    question: 'How do physical goods allowances and collections work?',
    answer:
      'Eligible students see available goods categories and remaining allowance limits in their portal. At collection time, a clerk records the items and you confirm the SMS/collection prompt before stock is released.'
  }
]);

export const HELP_GUIDES = Object.freeze([
  {
    id: 'STUDENT',
    roleLabel: 'Student',
    title: 'Student support & assistance applications',
    summary: 'Sign in with your MUST student email, review your university record, apply for tuition or upkeep aid, and collect physical goods.',
    primaryRoute: '/student',
    steps: [
      'Sign up or sign in under the Student tab using your MUST email (e.g. name123456@students.must.ac.ke).',
      'Check your read-only fee position, payment history, and aid status on University record (/student/record).',
      'Submit a tuition or upkeep request on Request assistance (/student/apply) and track its Need Index score.',
      'Request eligible supplies on Goods support (/student/goods) and confirm the collection prompt when collecting items.'
    ]
  },
  {
    id: 'DONOR',
    roleLabel: 'Donor',
    title: 'Donating money, declaring goods, and privacy choices',
    summary: 'Give through M-Pesa, Paybill, or bank channels, confirm physical drop-offs, download receipts, and choose your public recognition mode.',
    primaryRoute: '/donor',
    steps: [
      'Select the Donor tab on Sign in or Create an account to access the Donor dashboard (/donor).',
      'Initiate monetary gifts on Donate money (/donor/donate) or log physical drop-offs on Donate goods (/donor/goods).',
      'Save your Tracking ID and verification secret, or check Donation history (/donor/donations) and Receipts (/donor/receipts).',
      'Control whether you appear as Anonymous, an Alias, or Named on Public identity (/donor/identity).'
    ]
  },
  {
    id: 'CLERK',
    roleLabel: 'Clerk',
    title: 'Receiving donations, stock inspection, and student release',
    summary: 'Record incoming physical donations, await donor confirmation, inspect batches, and process student goods collections.',
    primaryRoute: '/clerk',
    steps: [
      'Log physical goods or cash drop-offs on Receive goods (/clerk/receive); wait for independent donor SMS confirmation.',
      'Inspect confirmed items and update batch condition on Pending confirmations (/clerk/confirmations).',
      'Monitor stock levels, reservations, and expiry dates on Inventory (/clerk/inventory).',
      'Verify student eligibility and record collections on Student collection (/clerk/collections).'
    ]
  },
  {
    id: 'COMMITTEE',
    roleLabel: 'Committee',
    title: 'Vetting review and two-of-three approvals',
    summary: 'Review pseudonymized student applications, declare any conflicts of interest, and record two-of-three approval decisions.',
    primaryRoute: '/committee',
    steps: [
      'Open Review queue (/committee/review) to inspect verified or manual-review cases without seeing private donor identities.',
      'Declare any personal or academic conflict of interest before recording a decision.',
      'Inspect the Need Index breakdown and approve, decline, or request review; two distinct signatories are required.'
    ]
  },
  {
    id: 'FINANCE',
    roleLabel: 'Finance Officer',
    title: 'Approved disbursements and reconciliation',
    summary: 'Execute payouts for committee-approved cases, handle payment exceptions, and reconcile central pool inflows and outflows.',
    primaryRoute: '/finance',
    steps: [
      'Open Approved disbursements (/finance/disbursements) to process payouts using the locked committee-approved amount.',
      'Investigate failed or incomplete provider callbacks under Payment exceptions (/finance/exceptions).',
      'Run daily and periodic statement matching on Reconciliation (/finance/reconciliation).'
    ]
  },
  {
    id: 'AUDITOR',
    roleLabel: 'Auditor',
    title: 'Forensic alerts and ledger verification',
    summary: 'Inspect automated anomaly alerts, verify money and goods trails, and validate on-chain anchors.',
    primaryRoute: '/auditor',
    steps: [
      'Review open forensic alerts on Anomaly cases (/auditor/anomalies).',
      'Compare inflow, disbursement, and stock movement records across Money audit (/auditor/money) and Goods audit (/auditor/goods).',
      'Verify anchored ledger digests and audit-chain integrity on Blockchain audit (/auditor/blockchain).'
    ]
  },
  {
    id: 'ADMIN',
    roleLabel: 'Administrator',
    title: 'Roles, policies, and system health',
    summary: 'Manage staff roles, vetting thresholds, inventory categories, integration health, and simulated university data.',
    primaryRoute: '/admin',
    steps: [
      'Assign or revoke staff and committee roles under Users and roles (/admin/users).',
      'Configure vetting policies and collection limits under Policy configuration (/admin/policies) and Inventory configuration (/admin/inventory).',
      'Monitor Daraja, IPFS, database, and RPC readiness on Integration health (/admin/integrations).'
    ]
  }
]);

export const TROUBLESHOOTING_ITEMS = Object.freeze([
  {
    id: 'incorrect-student-email',
    title: 'Seeing "Incorrect email" on student login or signup',
    body: 'Make sure the Student tab is selected and your email follows letters + 6 digits + @students.must.ac.ke (for example jane123456@students.must.ac.ke). Donors and staff should switch to their respective portal tab.'
  },
  {
    id: 'missing-tracking-secret',
    title: 'Cannot open a donation on Track a donation',
    body: 'Public tracking requires both the Tracking ID (MAL-XXXXXXXXXXXX) and the private verification secret issued when the donation was recorded. Authenticated donors can view all contributions from /donor/donations.'
  },
  {
    id: 'expired-confirmation',
    title: 'SMS confirmation expired or goods still pending',
    body: 'Unconfirmed physical donations never enter available stock. Ask the receiving clerk to review Pending confirmations or file a support note via Complaints and appeals (/complaints).'
  },
  {
    id: 'university-record-issue',
    title: 'University fee balance or aid record is inaccurate',
    body: 'Student records are authoritative and read-only inside CharityChain. Use Report a discrepancy (/student/appeals) so an administrator or records officer can log a verified correction.'
  }
]);

export const PUBLIC_SEARCH_PAGES = Object.freeze([
  { to: '/', label: 'Home', description: 'CharityChain overview and verified impact summary' },
  { to: '/how-it-works', label: 'How it works', description: 'Step-by-step money and physical-goods support flows' },
  { to: '/transparency', label: 'Transparency dashboard', description: 'Confirmed totals, pool balance, and reconciled outflows' },
  { to: '/track', label: 'Track a donation', description: 'Look up a donation status with Tracking ID and verification secret' },
  { to: '/goods', label: 'Goods catalogue', description: 'Categories of physical goods, allowance limits, and collection rules' },
  { to: '/recognition', label: 'Donor recognition', description: 'Public recognition wall, tiers, and privacy options' },
  { to: '/governance', label: 'Governance', description: 'Two-of-three approval rules and segregation of duties' },
  { to: '/policies', label: 'Policies', description: 'Operational rules, eligibility criteria, and cooling periods' },
  { to: '/privacy', label: 'Privacy notice', description: 'Data protection, masking, and student confidentiality' },
  { to: '/faq', label: 'Frequently asked questions (FAQ)', description: 'Plain-language answers about donations, students, and proof' },
  { to: '/help', label: 'Help center & user guides', description: 'Role guides, step-by-step workflows, and troubleshooting' },
  { to: '/complaints', label: 'Complaints and appeals', description: 'Submit an appeal or complaint for review' },
  { to: '/report-fraud', label: 'Report fraud', description: 'Flag suspected misuse, impersonation, or suspicious records' },
  { to: '/contact', label: 'Contact and support', description: 'Official support channels for donors, students, and security concerns' },
  { to: '/auth/login', label: 'Sign in', description: 'Student, Donor, Admin, and Secretariat login portals' },
  { to: '/auth/register', label: 'Create an account', description: 'Student (@students.must.ac.ke) and Donor registration' }
]);

const CONTEXTUAL_HELP_ROUTES = [
  {
    match: '/auth/login',
    title: 'Signing in to CharityChain',
    summary: 'Choose your portal tab first. Students must enter their official MUST student email.',
    steps: [
      'Select Student, Donor, Admin, or Secretariat at the top of the card.',
      'For Student login, use the format name123456@students.must.ac.ke.',
      'If you see "Incorrect email", verify the 6 digits and @students.must.ac.ke domain.'
    ],
    links: [
      { to: '/auth/register', label: 'Create an account' },
      { to: '/auth/password-recovery', label: 'Forgot password' },
      { to: '/faq', label: 'Read student login FAQ' }
    ]
  },
  {
    match: '/auth/register',
    title: 'Creating an account',
    summary: 'Students register with @students.must.ac.ke to unlock the Student support portal automatically.',
    steps: [
      'Select Student to register with name123456@students.must.ac.ke, or Donor for general giving.',
      'Use a password of at least 12 characters.',
      'Staff and committee roles are assigned internally by an administrator.'
    ],
    links: [
      { to: '/auth/login', label: 'Already registered? Sign in' },
      { to: '/help', label: 'View role guides' }
    ]
  },
  {
    match: '/track',
    title: 'Tracking a donation',
    summary: 'Private donation lookup protects donor confidentiality using two issued credentials.',
    steps: [
      'Enter your Tracking ID (format: MAL-XXXXXXXXXXXX).',
      'Enter the private verification secret provided on your receipt.',
      'If signed in as a donor, view all contributions directly in Donation history.'
    ],
    links: [
      { to: '/transparency', label: 'Open transparency dashboard' },
      { to: '/faq', label: 'Why are two credentials needed?' }
    ]
  },
  {
    match: '/student',
    title: 'Student portal help',
    summary: 'Review your verified university record, apply for financial assistance, or request goods.',
    steps: [
      'Review your fee balance and payment history under University record before applying.',
      'Explain your need clearly on Request assistance; Need Index factors update transparently.',
      'Report inaccurate university figures using Appeals / Report discrepancy.'
    ],
    links: [
      { to: '/student/record', label: 'University record' },
      { to: '/student/apply', label: 'Request assistance' },
      { to: '/student/appeals', label: 'Report a discrepancy' }
    ]
  },
  {
    match: '/donor',
    title: 'Donor portal help',
    summary: 'Donate money or goods, monitor confirmations, and manage how your name appears publicly.',
    steps: [
      'Initiate M-Pesa, Paybill, or bank donations from Donate money.',
      'Confirm SMS prompts for any physical goods logged by a clerk.',
      'Preview and save your Anonymous, Alias, or Named setting on Public identity.'
    ],
    links: [
      { to: '/donor/donate', label: 'Donate money' },
      { to: '/donor/identity', label: 'Public identity' },
      { to: '/track', label: 'Track a donation' }
    ]
  },
  {
    match: '/clerk',
    title: 'Clerk & inventory help',
    summary: 'Log incoming physical donations, inspect confirmed items, and process student collections.',
    steps: [
      'Record received donations accurately; stock updates only after donor SMS confirmation.',
      'Inspect pending batches before marking stock available for student requests.',
      'Always capture the student confirmation before releasing goods.'
    ],
    links: [
      { to: '/clerk/receive', label: 'Receive goods' },
      { to: '/clerk/inventory', label: 'Inventory' },
      { to: '/help', label: 'Full clerk guide' }
    ]
  },
  {
    match: '/committee',
    title: 'Committee review help',
    summary: 'Assess vetted applications objectively and uphold the two-of-three signatory rule.',
    steps: [
      'Review the Need Index factors and supporting timeline before voting.',
      'Declare any conflict of interest immediately if you know the applicant.',
      'Two distinct committee approvals are required before finance can disburse funds.'
    ],
    links: [
      { to: '/committee/review', label: 'Review queue' },
      { to: '/governance', label: 'Governance policy' }
    ]
  },
  {
    match: '/finance',
    title: 'Finance operations help',
    summary: 'Settle approved payouts without altering approved amounts and reconcile provider callbacks.',
    steps: [
      'Process payouts from Approved disbursements using the verified destination.',
      'Resolve failed or mismatched callbacks under Payment exceptions.',
      'Complete periodic matching on Reconciliation.'
    ],
    links: [
      { to: '/finance/disbursements', label: 'Disbursements' },
      { to: '/finance/reconciliation', label: 'Reconciliation' }
    ]
  },
  {
    match: '/auditor',
    title: 'Auditor & forensics help',
    summary: 'Investigate anomaly alerts and verify immutable audit-chain and blockchain anchors.',
    steps: [
      'Prioritise open anomaly cases and record clear investigation findings.',
      'Cross-check money and goods audits against public reconciled totals.',
      'Inspect on-chain digest verification in Blockchain audit.'
    ],
    links: [
      { to: '/auditor/anomalies', label: 'Forensic cases' },
      { to: '/auditor/blockchain', label: 'Blockchain audit' }
    ]
  },
  {
    match: '/admin',
    title: 'Administrator help',
    summary: 'Manage roles, policy configuration, simulated records, and integration readiness.',
    steps: [
      'Assign staff and committee roles carefully; administrators cannot approve payouts alone.',
      'Verify integration readiness (database, IPFS, Daraja, RPC) under Integration health.',
      'Review security incidents and session controls regularly.'
    ],
    links: [
      { to: '/admin/users', label: 'Users and roles' },
      { to: '/admin/integrations', label: 'Integration health' }
    ]
  }
];

const DEFAULT_CONTEXTUAL_HELP = {
  title: 'Using CharityChain',
  summary: 'Explore reconciled impact figures, track a donation privately, or find help for your portal.',
  steps: [
    'Use Quick search (Ctrl+K or Search in the header) from any screen to jump to pages or FAQs.',
    'Check the FAQ (/faq) for plain-language answers on donations, student vetting, and privacy.',
    'Visit the Help center (/help) for step-by-step guides tailored to each role.'
  ],
  links: [
    { to: '/faq', label: 'Browse FAQ' },
    { to: '/help', label: 'Open Help center' },
    { to: '/track', label: 'Track a donation' }
  ]
};

export function getContextualHelp(pathname = '/') {
  const matched = CONTEXTUAL_HELP_ROUTES.find((entry) => pathname.startsWith(entry.match));
  return matched ?? DEFAULT_CONTEXTUAL_HELP;
}

export function searchEverything(rawQuery, session = null) {
  const query = String(rawQuery ?? '').trim().toLowerCase();

  const portalNav = session
    ? [
        ...allowedNavigation(NAVIGATION.community ?? [], session),
        ...allowedNavigation(NAVIGATION.student ?? [], session),
        ...allowedNavigation(NAVIGATION.operations ?? [], session),
        ...allowedNavigation(NAVIGATION.governance ?? [], session),
        ...allowedNavigation(NAVIGATION.administration ?? [], session)
      ].map((item) => ({
        to: item.to,
        label: item.label,
        description: 'Portal screen'
      }))
    : [];

  const allPages = [...portalNav, ...PUBLIC_SEARCH_PAGES].filter(
    (item, index, list) => list.findIndex((other) => other.to === item.to) === index
  );

  if (!query) {
    return {
      trackingMatch: null,
      pages: allPages.slice(0, 6),
      faqs: FAQ_ITEMS.slice(0, 4),
      guides: HELP_GUIDES.slice(0, 3)
    };
  }

  const trimmedUpper = String(rawQuery ?? '').trim().toUpperCase();
  const trackingMatch = /^M(AL|LK)-[A-Z0-9_-]{3,12}$/.test(trimmedUpper) ? trimmedUpper : null;

  const pages = allPages.filter((page) =>
    `${page.label} ${page.description} ${page.to}`.toLowerCase().includes(query)
  );

  const faqs = FAQ_ITEMS.filter((item) =>
    `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(query)
  );

  const guides = HELP_GUIDES.filter((guide) =>
    `${guide.roleLabel} ${guide.title} ${guide.summary} ${guide.steps.join(' ')}`
      .toLowerCase()
      .includes(query)
  );

  return {
    trackingMatch,
    pages: pages.slice(0, 6),
    faqs: faqs.slice(0, 5),
    guides: guides.slice(0, 4)
  };
}
