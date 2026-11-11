import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { committeeService } from '../../src/modules/committee/committee.service.js';
import { conflictOfInterestService } from '../../src/modules/committee/conflictOfInterest.service.js';
import { membershipService } from '../../src/modules/committee/membership.service.js';

const run = Date.now();
let manager;
let resolver;
let chair;
let treasurer;
let secretary;
let ineligible;
let studentUser;
let student;
let application;
let chairMembership;
let treasurerMembership;
let secretaryMembership;
let conflict;

const manageAuth = (user = manager) => ({ user, permissions: [PERMISSIONS.COMMITTEE_MANAGE, PERMISSIONS.APPLICATION_REVIEW] });
const reviewAuth = () => ({ user: resolver, permissions: [PERMISSIONS.APPLICATION_REVIEW] });
const memberAuth = (user) => ({ user, permissions: [] });
const term = () => ({ termStartsAt: new Date(Date.now() - 86400000), termEndsAt: new Date(Date.now() + 365 * 86400000), reason: 'Approved executive committee appointment for the current governance term.' });

async function register(name) {
  return (await authService.register({ name, email: `${name.toLowerCase().replaceAll(' ','-')}-${run}@example.test`, password: 'Section17-Strong-Password-42!' })).user;
}

beforeAll(async () => {
  [manager, resolver, chair, treasurer, secretary, ineligible, studentUser] = await Promise.all([
    register('Committee Manager'), register('Committee Resolver'), register('Committee Chair'), register('Committee Treasurer'), register('Committee Secretary'), register('Committee Ineligible'), register('Committee Student')
  ]);
  await prisma.user.updateMany({ where: { id: { in: [manager.id, resolver.id, chair.id, treasurer.id, secretary.id] } }, data: { status: 'ACTIVE', emailVerified: true, twoFactorEnabled: true } });
  const semester = await prisma.academicSemester.findFirstOrThrow({ where: { active: true }, orderBy: { startsAt: 'desc' } });
  student = await prisma.student.create({ data: { userId: studentUser.id, registrationNumber: `MUST/COMMITTEE/${run}`, fullName: 'Committee Test Student', programme: 'BSC-COMMITTEE-TEST', school: 'School of Computing and Informatics', yearOfStudy: 3, academicStatus: 'ACTIVE', simulationProfile: 'MICRO_PAYMENT_HARDSHIP', admittedAt: new Date('2023-09-01'), expectedGraduation: new Date('2027-06-30') } });
  const financial = await prisma.studentFinancialRecord.create({ data: { studentId: student.id, semesterId: semester.id, invoicedAmount: 30000, paidAmount: 5000, aidAmount: 8000, outstandingBalance: 25000, status: 'BLOCKED' } });
  application = await prisma.assistanceApplication.create({ data: { reference: `APP-COMMITTEE-${run}`, studentId: student.id, semesterId: semester.id, type: 'TUITION', requestedAmount: 20000, reason: 'Verified hardship application awaiting committee governance review.', status: 'VERIFIED', financialRecordId: financial.id, outstandingBalanceSnapshot: 25000, submittedAt: new Date(), version: 4 } });
}, 60_000);

afterAll(async () => {
  if (application?.id) {
    await prisma.committeeConflict.deleteMany({ where: { applicationId: application.id } });
    await prisma.assistanceApplication.deleteMany({ where: { id: application.id } });
  }
  const membershipIds = [chairMembership?.id, treasurerMembership?.id, secretaryMembership?.id].filter(Boolean);
  if (membershipIds.length) {
    await prisma.committeeMembershipHistory.deleteMany({ where: { membershipId: { in: membershipIds } } });
    await prisma.committeeMembership.deleteMany({ where: { id: { in: membershipIds } } });
  }
  if (student?.id) {
    await prisma.studentFinancialRecord.deleteMany({ where: { studentId: student.id } });
    await prisma.student.deleteMany({ where: { id: student.id } });
  }
  const ids = [manager, resolver, chair, treasurer, secretary, ineligible, studentUser].filter(Boolean).map(({ id }) => id);
  if (ids.length) await prisma.user.deleteMany({ where: { id: { in: ids } } });
}, 60_000);

describe('Section 17 committee membership and conflict controls', () => {
  it('admits only active, verified, MFA-enabled signatories into the three fixed seats', async () => {
    await expect(membershipService.appoint(manageAuth(), { userId: ineligible.id, seat: 'CHAIRPERSON', ...term() })).rejects.toMatchObject({ code: 'CONFLICT' });
    chairMembership = await membershipService.appoint(manageAuth(), { userId: chair.id, seat: 'CHAIRPERSON', ...term() });
    treasurerMembership = await membershipService.appoint(manageAuth(), { userId: treasurer.id, seat: 'TREASURER', ...term() });
    secretaryMembership = await membershipService.appoint(manageAuth(), { userId: secretary.id, seat: 'SECRETARY', ...term() });
    expect([chairMembership.seat, treasurerMembership.seat, secretaryMembership.seat]).toEqual(['CHAIRPERSON','TREASURER','SECRETARY']);
    expect(chairMembership.history).toHaveLength(1);
    expect(chairMembership.history[0]).toMatchObject({ fromStatus: null, toStatus: 'ACTIVE', reason: expect.any(String), version: 1 });
    await expect(membershipService.appoint(manageAuth(), { userId: resolver.id, seat: 'CHAIRPERSON', ...term() })).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);

  it('enforces authorized, optimistic and historically recorded membership transitions', async () => {
    await expect(membershipService.suspend(reviewAuth(), chairMembership.id, { version: 1, reason: 'Unauthorized attempt to suspend an active committee signatory.' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    chairMembership = await membershipService.suspend(manageAuth(), chairMembership.id, { version: 1, reason: 'Temporary suspension pending an independent governance review.' });
    expect(chairMembership).toMatchObject({ status: 'SUSPENDED', version: 2 });
    await expect(membershipService.appoint(manageAuth(), { userId: chair.id, seat: 'CHAIRPERSON', ...term() })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(membershipService.reactivate(manageAuth(), chairMembership.id, { version: 1, reason: 'Stale concurrent membership reactivation must not be accepted.' })).rejects.toMatchObject({ code: 'CONFLICT' });
    chairMembership = await membershipService.reactivate(manageAuth(), chairMembership.id, { version: 2, reason: 'Independent review completed and signatory eligibility reconfirmed.' });
    expect(chairMembership).toMatchObject({ status: 'ACTIVE', version: 3 });
    expect(chairMembership.history.map(({ toStatus }) => toStatus)).toEqual(['ACTIVE','SUSPENDED','ACTIVE']);
  }, 30_000);

  it('allows members to declare conflicts but prevents duplicate declarations', async () => {
    conflict = await conflictOfInterestService.declare(memberAuth(chair), application.id, { membershipId: chairMembership.id, type: 'FAMILY_RELATIONSHIP', description: 'The applicant is an immediate family member of the chairperson.' });
    expect(conflict).toMatchObject({ status: 'DECLARED', applicationId: application.id, membershipId: chairMembership.id, declaredByUserId: chair.id });
    await expect(conflictOfInterestService.declare(memberAuth(chair), application.id, { membershipId: chairMembership.id, type: 'OTHER', description: 'A duplicate declaration that must not replace the original evidence.' })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(conflictOfInterestService.declare(memberAuth(resolver), application.id, { membershipId: chairMembership.id, type: 'OTHER', description: 'An unrelated user cannot declare a conflict for another member.' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  }, 30_000);

  it('requires an independent manager to resolve a conflict exactly once', async () => {
    await expect(conflictOfInterestService.resolve(manageAuth(chair), conflict.id, { status: 'CONFIRMED', resolutionNote: 'A member must never adjudicate their own conflict declaration.' })).rejects.toMatchObject({ code: 'CONFLICT' });
    conflict = await conflictOfInterestService.resolve(manageAuth(resolver), conflict.id, { status: 'CONFIRMED', resolutionNote: 'Relationship independently verified; member is excluded from this application.' });
    expect(conflict).toMatchObject({ status: 'CONFIRMED', resolvedByUserId: resolver.id, resolutionNote: expect.any(String) });
    expect(conflict.resolvedAt).toBeInstanceOf(Date);
    await expect(conflictOfInterestService.resolve(manageAuth(), conflict.id, { status: 'DISMISSED', resolutionNote: 'Resolved declarations are immutable and cannot be adjudicated twice.' })).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);

  it('exposes membership and conflict records only through governed access paths', async () => {
    expect((await committeeService.mine(memberAuth(chair))).id).toBe(chairMembership.id);
    expect(await committeeService.list(reviewAuth())).toHaveLength(3);
    await expect(committeeService.list(memberAuth(ineligible))).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const conflicts = await conflictOfInterestService.list(reviewAuth(), application.id);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ id: conflict.id, status: 'CONFIRMED' });
  }, 30_000);
});
