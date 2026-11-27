import type { PortalSession } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon?: string;
  roles?: string[];
  permissions?: string[];
}

export const NAVIGATION: Readonly<Record<'community' | 'student' | 'operations' | 'governance' | 'administration', readonly NavItem[]>> =
  Object.freeze({
    community: [
      { to: '/donor', label: 'Donor dashboard', icon: 'fa-house', roles: ['DONOR'] },
      { to: '/donor/donate', label: 'Donate money', icon: 'fa-hand-holding-heart', permissions: ['donation:create'] },
      { to: '/donor/goods', label: 'Donate goods', icon: 'fa-box-open', roles: ['DONOR'] },
      { to: '/donor/donations', label: 'Donation history', icon: 'fa-receipt', roles: ['DONOR'] },
      { to: '/donor/dapp', label: 'Impact badges & certificates', icon: 'fa-award', roles: ['DONOR'] },
      { to: '/donor/account', label: 'Account and security', icon: 'fa-user-shield', roles: ['DONOR'] },
    ],
    student: [
      { to: '/student', label: 'Student dashboard', icon: 'fa-house', roles: ['STUDENT'] },
      { to: '/student/record', label: 'University record', icon: 'fa-id-card', roles: ['STUDENT'] },
      { to: '/student/apply', label: 'Request assistance', icon: 'fa-hand-holding-dollar', roles: ['STUDENT'] },
      { to: '/student/applications', label: 'Applications', icon: 'fa-file-lines', roles: ['STUDENT'] },
      { to: '/student/goods', label: 'Goods collection', icon: 'fa-basket-shopping', roles: ['STUDENT'] },
      { to: '/student/goods/history', label: 'Collection history', icon: 'fa-clock-rotate-left', roles: ['STUDENT'] },
      { to: '/student/appeals', label: 'Review request', icon: 'fa-scale-balanced', roles: ['STUDENT'] },
      { to: '/student/account', label: 'Account and security', icon: 'fa-user-shield', roles: ['STUDENT'] },
    ],
    operations: [
      {
        to: '/clerk',
        label: 'Operations overview',
        icon: 'fa-clipboard-check',
        permissions: [
          'physical-donation:record',
          'physical-donation:inspect',
          'confirmation:manage',
          'inventory:read',
          'inventory:manage',
          'goods-collection:record',
          'goods-collection:release',
        ],
      },
      { to: '/clerk/receive', label: 'Receive donation', icon: 'fa-box-open', permissions: ['physical-donation:record'] },
      { to: '/clerk/confirmations', label: 'Confirmations', icon: 'fa-message', permissions: ['confirmation:manage'] },
      { to: '/clerk/inventory', label: 'Inventory', icon: 'fa-boxes-stacked', permissions: ['inventory:read'] },
      { to: '/clerk/collections', label: 'Student collections', icon: 'fa-hand-holding-heart', permissions: ['goods-collection:record'] },
      { to: '/clerk/reconciliation', label: 'Daily reconciliation', icon: 'fa-scale-balanced', permissions: ['reconciliation:read'] },
      { to: '/clerk/rejected', label: 'Rejected records', icon: 'fa-rotate-left', roles: ['CLERK', 'PHARMACY_CUSTODIAN', 'INVENTORY_SUPERVISOR'] },
      { to: '/inventory', label: 'Inventory oversight', icon: 'fa-warehouse', permissions: ['inventory:read', 'inventory:manage'] },
      { to: '/inventory/stock', label: 'Stock and adjustments', icon: 'fa-boxes-stacked', permissions: ['inventory:read', 'inventory:manage'] },
      { to: '/inventory/pharmacy', label: 'Pharmacy in-kind log', icon: 'fa-kit-medical', permissions: ['item-log:create', 'item:issue'] },
      {
        to: '/finance',
        label: 'Finance overview',
        icon: 'fa-building-columns',
        permissions: ['disbursement:create', 'disbursement:execute', 'disbursement:read', 'reconciliation:execute', 'reconciliation:read'],
      },
      { to: '/finance/disbursements', label: 'Disbursements', icon: 'fa-money-bill-transfer', permissions: ['disbursement:read'] },
      { to: '/finance/exceptions', label: 'Payment exceptions', icon: 'fa-triangle-exclamation', roles: ['FINANCE_OPERATOR', 'TREASURER'] },
      { to: '/finance/reconciliation', label: 'Reconciliation', icon: 'fa-scale-balanced', permissions: ['reconciliation:read'] },
    ],
    governance: [
      {
        to: '/committee',
        label: 'Committee overview',
        icon: 'fa-people-group',
        permissions: ['application:review', 'application:approve', 'committee:manage', 'case:read', 'case:decide'],
      },
      { to: '/committee/review', label: 'Review queue', icon: 'fa-file-circle-check', permissions: ['application:review'] },
      {
        to: '/committee/cases',
        label: 'Malkia aid cases',
        icon: 'fa-folder-open',
        permissions: ['case:read', 'case:create', 'case:decide', 'application:review', 'application:approve'],
      },
      {
        to: '/committee/cases/new',
        label: 'New aid case',
        icon: 'fa-plus-circle',
        permissions: ['case:create'],
      },
      {
        to: '/committee/signing',
        label: 'Web3 2-of-3 signing',
        icon: 'fa-key',
        permissions: ['release:authorize', 'committee:manage'],
      },
      {
        to: '/committee/history',
        label: 'Decision history',
        icon: 'fa-clock-rotate-left',
        permissions: ['application:review', 'application:approve', 'committee:manage'],
      },
      {
        to: '/committee/commitments',
        label: 'Funding commitments',
        icon: 'fa-hand-holding-dollar',
        permissions: ['application:review', 'application:approve', 'committee:manage'],
      },
      {
        to: '/auditor',
        label: 'Audit overview',
        icon: 'fa-magnifying-glass-chart',
        permissions: ['evidence:read', 'audit:read', 'forensics:read', 'forensics:investigate', 'report:read', 'report:generate'],
      },
      { to: '/auditor/anomalies', label: 'Forensic cases', icon: 'fa-triangle-exclamation', permissions: ['forensics:read'] },
      {
        to: '/auditor/fund-flow-dag',
        label: 'Fund-flow DAG (5-col)',
        icon: 'fa-diagram-project',
        permissions: ['forensics:read', 'alert:read', 'audit:read'],
      },
      {
        to: '/auditor/forensic-rules',
        label: 'Benford & rule tuning',
        icon: 'fa-sliders',
        permissions: ['forensics:read', 'alert:read', 'rules:manage'],
      },
      { to: '/auditor/money', label: 'Money audit', icon: 'fa-money-bill-wave', permissions: ['audit:read', 'forensics:read'] },
      { to: '/auditor/goods', label: 'Goods audit', icon: 'fa-boxes-stacked', permissions: ['audit:read', 'forensics:read'] },
      { to: '/auditor/blockchain', label: 'Evidence ledger', icon: 'fa-link', permissions: ['evidence:read', 'audit:read'] },
      { to: '/auditor/quarterly-reports', label: 'Quarterly reports', icon: 'fa-file-contract', permissions: ['report:read', 'report:generate'] },
      { to: '/admin', label: 'Administration', permissions: ['system:administer', 'user:manage', 'role:manage', 'policy:manage'] },
    ],
    administration: [
      { to: '/admin', label: 'Overview', icon: 'fa-chart-line', permissions: ['system:administer', 'user:manage', 'role:manage', 'policy:manage'] },
      { to: '/admin/users', label: 'Users and roles', icon: 'fa-users-gear', permissions: ['system:administer', 'user:manage', 'role:manage'] },
      { to: '/admin/policies', label: 'Policies', icon: 'fa-sliders', permissions: ['system:administer', 'policy:manage', 'vetting-policy:manage'] },
      { to: '/admin/university', label: 'University records', icon: 'fa-graduation-cap', permissions: ['system:administer', 'student-record:manage', 'student-record:read:all'] },
      { to: '/admin/inventory', label: 'Inventory setup', icon: 'fa-boxes-stacked', permissions: ['system:administer', 'inventory:manage'] },
      { to: '/admin/integrations', label: 'Integrations', icon: 'fa-plug', permissions: ['system:administer'] },
      { to: '/admin/security', label: 'Audit and security', icon: 'fa-shield-halved', permissions: ['system:administer', 'audit:read'] },
      { to: '/app', label: 'Malkia Web3 workspace', icon: 'fa-cubes', permissions: ['system:administer'] },
    ],
  });

export function allowedNavigation(
  items: readonly NavItem[],
  session: PortalSession | null | undefined
): NavItem[] {
  return items.filter((item) => {
    const roleAllowed = !item.roles?.length || item.roles.some((role) => session?.roles?.includes(role));
    const permissionAllowed =
      !item.permissions?.length ||
      item.permissions.some((permission) => session?.permissions?.includes(permission));
    return roleAllowed && permissionAllowed;
  });
}
