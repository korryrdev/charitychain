'use strict';

import { describe, expect, it } from 'vitest';
import {
  createComplaintSchema,
  createFraudReportSchema,
  resolveComplaintSchema,
} from './complaints.validation.js';
import {
  assertCanCreateComplaint,
  assertCanManageComplaints,
} from './complaints.policy.js';

describe('Complaints & Fraud Validation + RBAC Policy', () => {
  it('validates complaint and fraud report schemas and rejects underspecified descriptions', () => {
    expect(
      createComplaintSchema.safeParse({
        category: 'DONATION_ISSUE',
        subject: 'Receipt mismatch',
        description: 'The donation receipt date does not match my M-Pesa SMS confirmation.',
      }).success
    ).toBe(true);

    expect(
      createComplaintSchema.safeParse({
        category: 'DONATION_ISSUE',
        subject: 'Hi',
        description: 'Too short',
      }).success
    ).toBe(false);

    expect(
      createFraudReportSchema.safeParse({
        category: 'IMPERSONATION',
        description: 'Someone claiming to represent the committee requested my OTP.',
        reporterContact: '',
      }).success
    ).toBe(true);

    expect(
      resolveComplaintSchema.safeParse({
        status: 'RESOLVED',
        notes: 'Reviewed bank logs and closed ticket.',
      }).success
    ).toBe(true);
  });

  it('enforces complaint:create and complaint:manage permissions', () => {
    expect(() =>
      assertCanCreateComplaint({ user: { id: 'u1' }, permissions: [] })
    ).toThrow();
    expect(() =>
      assertCanCreateComplaint({ user: { id: 'u1' }, permissions: ['complaint:create'] })
    ).not.toThrow();

    expect(() =>
      assertCanManageComplaints({ user: { id: 'u2' }, permissions: ['complaint:create'] })
    ).toThrow();
    expect(() =>
      assertCanManageComplaints({ user: { id: 'u2' }, permissions: ['complaint:manage'] })
    ).not.toThrow();
  });
});
