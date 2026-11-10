import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { applicationsService } from '../../src/modules/applications/applications.service.js';
import { authService } from '../../src/modules/auth/auth.service.js';

const run = Date.now();
let studentUser;
let reviewerUser;
let student;
let semester;
let financial;
let tuition;
const studentAuth = () => ({ user: studentUser, permissions: [PERMISSIONS.APPLICATION_CREATE, PERMISSIONS.APPLICATION_READ_SELF] });
const reviewerAuth = () => ({ user: reviewerUser, permissions: [PERMISSIONS.APPLICATION_REVIEW] });
const unauthorizedAuth = () => ({ user: reviewerUser, permissions: [] });

beforeAll(async () => {
  studentUser = (await authService.register({ name: 'Application Student', email: `application-student-${run}@example.test`, password: 'Section15-Strong-Password-42!' })).user;
  reviewerUser = (await authService.register({ name: 'Application Reviewer', email: `application-reviewer-${run}@example.test`, password: 'Section15-Strong-Password-42!' })).user;
  semester = await prisma.academicSemester.findFirstOrThrow({ where: { active: true }, orderBy: { startsAt: 'desc' } });
  student = await prisma.student.create({ data: { userId: studentUser.id, registrationNumber: `MUST/APP/${run}`, fullName: 'Application Student', programme: 'BSC-COMPUTER-SCIENCE', school: 'School of Computing and Informatics', yearOfStudy: 3, academicStatus: 'ACTIVE', simulationProfile: 'MICRO_PAYMENT_HARDSHIP', admittedAt: new Date('2023-09-01'), expectedGraduation: new Date('2027-06-30') } });
  financial = await prisma.studentFinancialRecord.create({ data: { studentId: student.id, semesterId: semester.id, invoicedAmount: 27000, paidAmount: 13700, aidAmount: 8000, outstandingBalance: 13300, status: 'BLOCKED' } });
}, 30_000);

afterAll(async () => {
  if (student?.id) {
    const applications = await prisma.assistanceApplication.findMany({ where: { studentId: student.id }, select: { id: true } });
    await prisma.assistanceApplicationHistory.deleteMany({ where: { applicationId: { in: applications.map(({ id }) => id) } } });
    await prisma.assistanceApplication.deleteMany({ where: { studentId: student.id } });
    await prisma.studentFinancialRecord.deleteMany({ where: { studentId: student.id } });
    await prisma.student.deleteMany({ where: { id: student.id } });
  }
  const ids = [studentUser?.id, reviewerUser?.id].filter(Boolean);
  if (ids.length) await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

describe('Section 15 student applications', () => {
  it('enforces the active semester, tuition balance, and upkeep ceiling', async () => {
    await expect(applicationsService.create(studentAuth(), { type: 'TUITION', requestedAmount: 14000, reason: 'My family cannot cover the remaining university fee balance this semester.' })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(applicationsService.create(studentAuth(), { type: 'UPKEEP', requestedAmount: 15001, reason: 'I require temporary upkeep support for food and essential transport costs.' })).rejects.toMatchObject({ code: 'CONFLICT' });
    tuition = await applicationsService.create(studentAuth(), { type: 'TUITION', requestedAmount: 12000, reason: 'My household income is irregular and cannot clear the remaining semester fees.' });
    expect(tuition).toMatchObject({ type: 'TUITION', status: 'DRAFT', requestedAmount: '12000', version: 1 });
    expect(tuition.financialSnapshot).toMatchObject({ financialRecordId: financial.id, outstandingBalance: '13300' });
    expect(tuition.reference).toMatch(/^APP-\d{4}-[A-F0-9]{12}$/);
    expect(tuition.history).toHaveLength(1);
    expect(tuition.history[0]).toMatchObject({ fromStatus: null, toStatus: 'DRAFT', version: 1 });
  });

  it('updates drafts optimistically and blocks duplicate semester applications', async () => {
    await expect(applicationsService.updateDraft(studentAuth(), tuition.id, { requestedAmount: 11000, reason: 'Updated hardship explanation after reviewing the exact household contribution.', version: 99 })).rejects.toMatchObject({ code: 'CONFLICT' });
    tuition = await applicationsService.updateDraft(studentAuth(), tuition.id, { requestedAmount: 11000, reason: 'Updated hardship explanation after reviewing the exact household contribution.', version: tuition.version });
    expect(tuition).toMatchObject({ requestedAmount: '11000', version: 2 });
    await expect(applicationsService.create(studentAuth(), { type: 'TUITION', requestedAmount: 10000, reason: 'A duplicate tuition request that must be rejected for this active semester.' })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('revalidates the live financial record at submission and records immutable history', async () => {
    await prisma.studentFinancialRecord.update({ where: { id: financial.id }, data: { outstandingBalance: 10000 } });
    await expect(applicationsService.submit(studentAuth(), tuition.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    await prisma.studentFinancialRecord.update({ where: { id: financial.id }, data: { outstandingBalance: 13300 } });
    tuition = await applicationsService.submit(studentAuth(), tuition.id);
    expect(tuition).toMatchObject({ status: 'SUBMITTED', version: 3 });
    expect(tuition.submittedAt).toBeInstanceOf(Date);
    expect(tuition.history.map(({ toStatus }) => toStatus)).toEqual(['DRAFT','DRAFT','SUBMITTED']);
    expect(tuition.history[1]).toMatchObject({ fromStatus: 'DRAFT', toStatus: 'DRAFT', reason: 'DRAFT_UPDATED', version: 2 });
    await expect(applicationsService.updateDraft(studentAuth(), tuition.id, { requestedAmount: 9000, reason: 'Submitted records must no longer be editable by the applicant account.', version: tuition.version })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('enforces ownership, reviewer permissions, transitions, and stale-version rejection', async () => {
    await expect(applicationsService.get(unauthorizedAuth(), tuition.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await applicationsService.get(reviewerAuth(), tuition.id)).id).toBe(tuition.id);
    await expect(applicationsService.transition(reviewerAuth(), tuition.id, { status: 'APPROVED', reason: 'Attempted state-machine bypass.', version: tuition.version })).rejects.toMatchObject({ code: 'CONFLICT' });
    tuition = await applicationsService.transition(reviewerAuth(), tuition.id, { status: 'VETTING', reason: 'Queued for automated financial vetting.', version: tuition.version });
    await expect(applicationsService.transition(reviewerAuth(), tuition.id, { status: 'VERIFIED', reason: 'Stale concurrent decision.', version: tuition.version - 1 })).rejects.toMatchObject({ code: 'CONFLICT' });
    tuition = await applicationsService.transition(reviewerAuth(), tuition.id, { status: 'VERIFIED', reason: 'Financial evidence meets the verification threshold.', version: tuition.version });
    tuition = await applicationsService.transition(reviewerAuth(), tuition.id, { status: 'AWAITING_APPROVALS', reason: 'Verified application is ready for committee review.', version: tuition.version });
    expect(tuition.history.map(({ toStatus }) => toStatus)).toEqual(['DRAFT','DRAFT','SUBMITTED','VETTING','VERIFIED','AWAITING_APPROVALS']);
  });

  it('allows cancellation only at permitted stages while preserving duplicate prevention', async () => {
    let upkeep = await applicationsService.create(studentAuth(), { type: 'UPKEEP', requestedAmount: 8000, reason: 'Temporary upkeep support is needed for food, transport, and hygiene supplies.' });
    upkeep = await applicationsService.cancel(studentAuth(), upkeep.id);
    expect(upkeep).toMatchObject({ status: 'CANCELLED', version: 2 });
    expect(upkeep.cancelledAt).toBeInstanceOf(Date);
    await expect(applicationsService.create(studentAuth(), { type: 'UPKEEP', requestedAmount: 7000, reason: 'A second same-semester upkeep application must remain prohibited after cancellation.' })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(applicationsService.cancel(studentAuth(), tuition.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    const mine = await applicationsService.listMine(studentAuth(), { page: 1, pageSize: 25 });
    expect(mine.total).toBe(2);
    const reviewQueue = await applicationsService.listAll(reviewerAuth(), { status: 'AWAITING_APPROVALS', page: 1, pageSize: 25 });
    expect(reviewQueue.items.some((application) => application.id === tuition.id)).toBe(true);
  });
});
