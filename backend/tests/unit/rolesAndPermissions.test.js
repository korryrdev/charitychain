import { describe, it, expect } from 'vitest';
import {
  ROLES,
  requires2Fa,
  canApproveOrDisburseFunds,
  ROLES_REQUIRING_2FA
} from '../../src/constants/roles.js';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { assertSegregation } from '../../src/utils/assertions.js';
import { AuthorizationError } from '../../src/errors/AuthorizationError.js';

describe('G02: Roles and Permission Matrix (FR-AUTH-01, FR-AUTH-03)', () => {
  it('defines the 7 primary PRD roles according to Section 4.2', () => {
    const prdRoles = [
      ROLES.SUBGROUP_REP,
      ROLES.COMMITTEE_MEMBER,
      ROLES.TREASURER,
      ROLES.SIGNATORY,
      ROLES.PHARMACY_CUSTODIAN,
      ROLES.MEMBER_AUDITOR,
      ROLES.SYSTEM_ADMIN
    ];

    expect(prdRoles).toHaveLength(7);
    expect(new Set(prdRoles).size).toBe(7);
  });

  it('FR-AUTH-01: mandates 2FA for committee, treasurer, and signatory roles', () => {
    expect(requires2Fa(ROLES.COMMITTEE_MEMBER)).toBe(true);
    expect(requires2Fa(ROLES.TREASURER)).toBe(true);
    expect(requires2Fa(ROLES.SIGNATORY)).toBe(true);

    expect(requires2Fa(ROLES.SUBGROUP_REP)).toBe(false);
    expect(requires2Fa(ROLES.PHARMACY_CUSTODIAN)).toBe(false);
    expect(requires2Fa(ROLES.MEMBER_AUDITOR)).toBe(false);
  });

  it('FR-AUTH-03: prohibits SYSTEM_ADMIN and auditors from approving or disbursing money', () => {
    expect(canApproveOrDisburseFunds(ROLES.SYSTEM_ADMIN)).toBe(false);
    expect(canApproveOrDisburseFunds(ROLES.MEMBER_AUDITOR)).toBe(false);
    expect(canApproveOrDisburseFunds(ROLES.AUDITOR)).toBe(false);

    expect(canApproveOrDisburseFunds(ROLES.COMMITTEE_MEMBER)).toBe(true);
    expect(canApproveOrDisburseFunds(ROLES.SIGNATORY)).toBe(true);
    expect(canApproveOrDisburseFunds(ROLES.TREASURER)).toBe(true);
  });

  it('FR-AUTH-03: enforces segregation of duties in code (creator cannot approve/verify own submission)', () => {
    const creatorId = 'user-subgroup-rep-1';
    const approverId = 'user-committee-member-2';

    // Different users pass
    expect(() => assertSegregation(approverId, creatorId)).not.toThrow();

    // Same user fails with AuthorizationError
    expect(() => assertSegregation(creatorId, creatorId)).toThrow(AuthorizationError);
  });

  it('FR-AUTH-03: provides permissions for case workflow, fund flow, and forensics', () => {
    expect(PERMISSIONS.CASE_CREATE).toBe('case:create');
    expect(PERMISSIONS.CASE_DECIDE).toBe('case:decide');
    expect(PERMISSIONS.RELEASE_AUTHORIZE).toBe('release:authorize');
    expect(PERMISSIONS.BANK_DEPOSIT_CREATE).toBe('bank-deposit:create');
    expect(PERMISSIONS.BANK_DEPOSIT_VERIFY).toBe('bank-deposit:verify');
    expect(PERMISSIONS.ITEM_LOG_CREATE).toBe('item-log:create');
    expect(PERMISSIONS.ALERT_READ).toBe('alert:read');
    expect(PERMISSIONS.SYSTEM_ADMINISTER).toBe('system:administer');
  });
});

