export const PERMISSIONS = Object.freeze({
  PROFILE_READ_SELF: 'profile:read:self',
  PROFILE_UPDATE_SELF: 'profile:update:self',
  DONATION_CREATE: 'donation:create',
  DONATION_READ_SELF: 'donation:read:self',
  DONATION_READ_ALL: 'donation:read:all',
  PHYSICAL_DONATION_RECORD: 'physical-donation:record',
  PHYSICAL_DONATION_INSPECT: 'physical-donation:inspect',
  CONFIRMATION_MANAGE: 'confirmation:manage',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_MANAGE: 'inventory:manage',
  GOODS_COLLECTION_RECORD: 'goods-collection:record',
  GOODS_COLLECTION_RELEASE: 'goods-collection:release',
  STUDENT_RECORD_READ_SELF: 'student-record:read:self',
  STUDENT_RECORD_READ_ALL: 'student-record:read:all',
  STUDENT_RECORD_MANAGE: 'student-record:manage',
  APPLICATION_CREATE: 'application:create',
  APPLICATION_READ_SELF: 'application:read:self',
  APPLICATION_REVIEW: 'application:review',
  VETTING_EXECUTE: 'vetting:execute',
  VETTING_POLICY_MANAGE: 'vetting-policy:manage',
  APPLICATION_APPROVE: 'application:approve',
  COMMITTEE_MANAGE: 'committee:manage',
  DISBURSEMENT_CREATE: 'disbursement:create',
  DISBURSEMENT_EXECUTE: 'disbursement:execute',
  DISBURSEMENT_READ: 'disbursement:read',
  RECONCILIATION_EXECUTE: 'reconciliation:execute',
  RECONCILIATION_READ: 'reconciliation:read',
  EVIDENCE_READ: 'evidence:read',
  AUDIT_READ: 'audit:read',
  FORENSICS_READ: 'forensics:read',
  FORENSICS_INVESTIGATE: 'forensics:investigate',
  REPORT_READ: 'report:read',
  REPORT_GENERATE: 'report:generate',
  COMPLAINT_CREATE: 'complaint:create',
  COMPLAINT_MANAGE: 'complaint:manage',
  POLICY_MANAGE: 'policy:manage',
  ROLE_MANAGE: 'role:manage',
  USER_MANAGE: 'user:manage',
  SYSTEM_ADMINISTER: 'system:administer'
});

export const PERMISSION_VALUES = Object.freeze(Object.values(PERMISSIONS));

export function isPermission(value) {
  return PERMISSION_VALUES.includes(value);
}
