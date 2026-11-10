export const ROLES = Object.freeze({
  // PRD Primary Roles (FR-AUTH-01, Section 4.2)
  SUBGROUP_REP: 'SUBGROUP_REP',
  COMMITTEE_MEMBER: 'COMMITTEE_MEMBER',
  TREASURER: 'TREASURER',
  SIGNATORY: 'SIGNATORY',
  PHARMACY_CUSTODIAN: 'PHARMACY_CUSTODIAN',
  MEMBER_AUDITOR: 'MEMBER_AUDITOR',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',

  // Legacy/Compatibility Roles
  DONOR: 'DONOR',
  STUDENT: 'STUDENT',
  CLERK: 'CLERK',
  INVENTORY_SUPERVISOR: 'INVENTORY_SUPERVISOR',
  FINANCE_OPERATOR: 'FINANCE_OPERATOR',
  AUDITOR: 'AUDITOR',
  ADMINISTRATOR: 'ADMINISTRATOR'
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export function isRole(value) {
  return ROLE_VALUES.includes(value);
}

/**
 * Roles that mandate Two-Factor Authentication (2FA / TOTP) per FR-AUTH-01.
 */
export const ROLES_REQUIRING_2FA = Object.freeze([
  ROLES.COMMITTEE_MEMBER,
  ROLES.TREASURER,
  ROLES.SIGNATORY
]);

export function requires2Fa(role) {
  return ROLES_REQUIRING_2FA.includes(role);
}

/**
 * Validates whether a role is barred from approving or editing money per FR-AUTH-03.
 * SYSTEM_ADMIN and MEMBER_AUDITOR are read-only / administrative and CANNOT approve funds.
 */
export function canApproveOrDisburseFunds(role) {
  if (role === ROLES.SYSTEM_ADMIN || role === ROLES.ADMINISTRATOR || role === ROLES.MEMBER_AUDITOR || role === ROLES.AUDITOR) {
    return false;
  }
  return [ROLES.COMMITTEE_MEMBER, ROLES.TREASURER, ROLES.SIGNATORY].includes(role);
}
