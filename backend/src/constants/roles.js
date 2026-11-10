export const ROLES = Object.freeze({
  DONOR: 'DONOR',
  STUDENT: 'STUDENT',
  CLERK: 'CLERK',
  INVENTORY_SUPERVISOR: 'INVENTORY_SUPERVISOR',
  COMMITTEE_MEMBER: 'COMMITTEE_MEMBER',
  FINANCE_OPERATOR: 'FINANCE_OPERATOR',
  AUDITOR: 'AUDITOR',
  ADMINISTRATOR: 'ADMINISTRATOR'
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export function isRole(value) {
  return ROLE_VALUES.includes(value);
}
