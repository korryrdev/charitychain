export interface PermissionGroup {
  id: string;
  title: string;
  items: readonly (readonly [string, string])[];
}

export interface PermissionEntry {
  code: string;
  label: string;
  group: string;
}

export const PERMISSION_GROUPS: readonly PermissionGroup[] = Object.freeze([
  { id: 'account', title: 'Personal account', items: [['profile:read:self', 'View own profile'], ['profile:update:self', 'Update own profile']] },
  { id: 'donations', title: 'Money donations', items: [['donation:create', 'Create donation requests'], ['donation:read:self', 'View own donations'], ['donation:read:all', 'View all donation records'], ['bank-deposit:create', 'Record bank deposits'], ['bank-deposit:verify', 'Verify bank deposits']] },
  { id: 'physical', title: 'Physical donations', items: [['physical-donation:record', 'Record received goods or cash'], ['physical-donation:inspect', 'Inspect confirmed donations'], ['confirmation:manage', 'Manage independent confirmations']] },
  { id: 'inventory', title: 'Inventory and collections', items: [['inventory:read', 'View stock and batches'], ['inventory:manage', 'Manage stock, locations, and adjustments'], ['goods-collection:record', 'Record student collections'], ['goods-collection:release', 'Release confirmed collections'], ['item-log:create', 'Log in-kind pharmacy stock'], ['item:issue', 'Issue stock to approved cases']] },
  { id: 'students', title: 'Student records and support', items: [['student-record:read:self', 'View own university record'], ['student-record:read:all', 'View all university records'], ['student-record:manage', 'Manage simulated university records'], ['application:create', 'Create support applications'], ['application:read:self', 'View own applications'], ['application:review', 'Review support applications']] },
  { id: 'governance', title: 'Vetting and committee', items: [['vetting:execute', 'Run needs vetting'], ['vetting-policy:manage', 'Manage vetting policy'], ['application:approve', 'Record committee decisions'], ['committee:manage', 'Manage committee membership'], ['case:create', 'Create sub-group aid cases'], ['case:read', 'View aid cases'], ['case:update:draft', 'Edit draft aid cases'], ['case:submit', 'Submit aid cases for review'], ['case:decide', 'Approve or decline aid cases'], ['release:authorize', 'Authorize EIP-712 fund releases']] },
  { id: 'finance', title: 'Finance and reconciliation', items: [['disbursement:create', 'Create approved payouts'], ['disbursement:execute', 'Execute approved payouts'], ['disbursement:read', 'View payout records'], ['reconciliation:execute', 'Run reconciliation'], ['reconciliation:read', 'View reconciliation results']] },
  { id: 'assurance', title: 'Evidence, audit, and reports', items: [['evidence:read', 'View tamper-evident evidence'], ['audit:read', 'View audit logs'], ['forensics:read', 'View forensic cases'], ['forensics:investigate', 'Investigate forensic cases'], ['report:read', 'View reports'], ['report:generate', 'Generate reports'], ['alert:read', 'View forensic alerts'], ['alert:resolve', 'Resolve forensic alerts'], ['rules:manage', 'Manage forensic rule thresholds']] },
  { id: 'administration', title: 'Complaints, recognition, and administration', items: [['complaint:create', 'Create complaints or appeals'], ['complaint:manage', 'Manage complaints and appeals'], ['policy:manage', 'Manage operational policy'], ['badge-tier:manage', 'Configure recognition badge tiers'], ['recognition:moderate', 'Moderate public donor names'], ['donor-identity:reveal', 'Reveal masked donor references'], ['role:manage', 'Create and assign roles'], ['user:manage', 'Manage user access'], ['system:administer', 'Access system administration']] }
]);

export const ALL_PERMISSIONS: readonly PermissionEntry[] = Object.freeze(
  PERMISSION_GROUPS.flatMap((group) => group.items.map(([code, label]) => ({ code, label, group: group.title }))),
);

export function roleCodeFromName(name: string): string {
  const slug = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return slug.length >= 3 ? `CUSTOM_${slug}`.slice(0, 40) : '';
}
