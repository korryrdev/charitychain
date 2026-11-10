export const NAVIGATION = Object.freeze({
  community: [
    { to: '/donor', label: 'Donor dashboard', roles: ['DONOR'] },
    { to: '/donor/donate', label: 'Donate money', permissions: ['donation:create'] },
    { to: '/student', label: 'Student dashboard', roles: ['STUDENT'] },
    { to: '/student/applications', label: 'My applications', permissions: ['application:create'] },
  ],
  operations: [
    { to: '/clerk', label: 'Clerk dashboard', roles: ['CLERK'] },
    { to: '/clerk/receive', label: 'Receive goods', permissions: ['physical-donation:record'] },
    { to: '/clerk/inventory', label: 'Inventory', permissions: ['inventory:read'] },
    { to: '/finance', label: 'Finance dashboard', roles: ['FINANCE_OFFICER'] },
    { to: '/finance/disbursements', label: 'Disbursements', permissions: ['disbursement:read'] },
  ],
  governance: [
    { to: '/committee', label: 'Committee dashboard', roles: ['COMMITTEE_MEMBER'] },
    { to: '/committee/review', label: 'Review queue', permissions: ['application:review'] },
    { to: '/auditor', label: 'Audit dashboard', roles: ['AUDITOR'] },
    { to: '/auditor/anomalies', label: 'Forensic cases', permissions: ['forensics:read'] },
    { to: '/admin', label: 'Administration', roles: ['ADMIN'] },
  ],
});

export function allowedNavigation(items, session) {
  return items.filter((item) => {
    const roleAllowed = !item.roles?.length || item.roles.some((role) => session?.roles?.includes(role));
    const permissionAllowed = !item.permissions?.length || item.permissions.some((permission) => session?.permissions?.includes(permission));
    return roleAllowed && permissionAllowed;
  });
}
