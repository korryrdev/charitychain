import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { applicationsService } from '../../src/modules/applications/applications.service.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { vettingService } from '../../src/modules/vetting/vetting.service.js';
import { createVettingPolicySchema } from '../../src/modules/vetting/vetting.validation.js';
import { DEFAULT_VETTING_POLICY, vettingPolicyService } from '../../src/modules/vetting/vettingPolicy.service.js';

const run = Date.now();
const programme = `BSC-VETTING-${run}`;
let semester;
let needyUser;
let lowNeedUser;
let operatorUser;
let outsiderUser;
let needyStudent;
let lowNeedStudent;
let needyApplication;
let lowNeedApplication;
let verifiedRun;
let customPolicy;

const studentAuth = (user) => ({
  user,
  permissions: [PERMISSIONS.APPLICATION_CREATE, PERMISSIONS.APPLICATION_READ_SELF],
});
const operatorAuth = () => ({
  user: operatorUser,
  permissions: [PERMISSIONS.VETTING_EXECUTE, PERMISSIONS.APPLICATION_REVIEW],
});
const policyManagerAuth = () => ({ user: operatorUser, permissions: [PERMISSIONS.VETTING_POLICY_MANAGE] });
const noPermissions = () => ({ user: outsiderUser, permissions: [] });

async function createStudentScenario({ user, registrationNumber, fullName, needy }) {
  const student = await prisma.student.create({
    data: {
      userId: user.id,
      registrationNumber,
      fullName,
      programme,
      school: 'School of Computing and Informatics',
      yearOfStudy: 3,
      academicStatus: 'ACTIVE',
      simulationProfile: needy ? 'MICRO_PAYMENT_HARDSHIP' : 'STABLE_LUMP_SUM_CONTROL',
      admittedAt: new Date('2023-09-01'),
      expectedGraduation: new Date('2027-06-30'),
    },
  });
  await prisma.studentFinancialRecord.create({
    data: {
      studentId: student.id,
      semesterId: semester.id,
      invoicedAmount: 30000,
      paidAmount: needy ? 9000 : 27000,
      aidAmount: needy ? 8000 : 0,
      outstandingBalance: needy ? 21000 : 3000,
      status: needy ? 'BLOCKED' : 'PARTIALLY_PAID',
    },
  });
  return student;
}

beforeAll(async () => {
  needyUser = (await authService.register({ name: 'Vetting Needy Student', email: `vetting-needy-${run}@example.test`, password: 'Section16-Strong-Password-42!' })).user;
  lowNeedUser = (await authService.register({ name: 'Vetting Stable Student', email: `vetting-stable-${run}@example.test`, password: 'Section16-Strong-Password-42!' })).user;
  operatorUser = (await authService.register({ name: 'Vetting Operator', email: `vetting-operator-${run}@example.test`, password: 'Section16-Strong-Password-42!' })).user;
  outsiderUser = (await authService.register({ name: 'Vetting Outsider', email: `vetting-outsider-${run}@example.test`, password: 'Section16-Strong-Password-42!' })).user;
  semester = await prisma.academicSemester.findFirstOrThrow({ where: { active: true }, orderBy: { startsAt: 'desc' } });
  needyStudent = await createStudentScenario({ user: needyUser, registrationNumber: `MUST/VET/NEEDY/${run}`, fullName: 'Vetting Needy Student', needy: true });
  lowNeedStudent = await createStudentScenario({ user: lowNeedUser, registrationNumber: `MUST/VET/STABLE/${run}`, fullName: 'Vetting Stable Student', needy: false });

  const examStartsAt = new Date(semester.endsAt.getTime() - 14 * 86400000);
  await prisma.examCalendar.create({
    data: { semesterId: semester.id, programme, examType: `MAIN-${run}`, startsAt: examStartsAt, endsAt: new Date(examStartsAt.getTime() + 7 * 86400000), clearanceDeadline: new Date(examStartsAt.getTime() - 86400000) },
  });
  await prisma.studentPayment.createMany({
    data: [
      { studentId: needyStudent.id, semesterId: semester.id, reference: `VET-MICRO-1-${run}`, amount: 1500, source: 'FAMILY', paidAt: new Date(examStartsAt.getTime() - 2 * 86400000) },
      { studentId: needyStudent.id, semesterId: semester.id, reference: `VET-MICRO-2-${run}`, amount: 3000, source: 'SELF', paidAt: new Date(examStartsAt.getTime() - 86400000) },
      { studentId: needyStudent.id, semesterId: semester.id, reference: `VET-MICRO-3-${run}`, amount: 1200, source: 'FAMILY', paidAt: new Date(semester.startsAt.getTime() + 14 * 86400000) },
      { studentId: needyStudent.id, semesterId: semester.id, reference: `VET-MICRO-4-${run}`, amount: 3300, source: 'FAMILY', paidAt: new Date(semester.startsAt.getTime() + 35 * 86400000) },
      { studentId: lowNeedStudent.id, semesterId: semester.id, reference: `VET-LUMP-${run}`, amount: 27000, source: 'FAMILY', paidAt: new Date(semester.startsAt.getTime() + 86400000) },
    ],
  });
  await prisma.studentAidRecord.create({
    data: { studentId: needyStudent.id, semesterId: semester.id, aidType: 'HELB', providerName: 'Higher Education Loans Board', awardedAmount: 8000, disbursedAmount: 8000, status: 'DISBURSED', reference: `VET-HELB-${run}`, disbursedAt: new Date(semester.startsAt.getTime() + 21 * 86400000) },
  });
  await prisma.studentFinanceBlock.createMany({
    data: [
      { studentId: needyStudent.id, semesterId: semester.id, blockType: 'EXAM_CLEARANCE', reason: 'Outstanding tuition balance', blockedAt: new Date(examStartsAt.getTime() - 5 * 86400000), resolvedAt: new Date(examStartsAt.getTime() - 86400000) },
      { studentId: needyStudent.id, semesterId: semester.id, blockType: 'PORTAL_RESTRICTION', reason: 'Outstanding tuition balance', blockedAt: new Date(examStartsAt.getTime() - 4 * 86400000) },
    ],
  });
  await prisma.studentAssistanceHistory.create({
    data: { studentId: needyStudent.id, semesterId: semester.id, assistanceType: 'GOODS', providerName: 'CharityChain Foundation', amount: 1500, reference: `VET-ASSIST-${run}`, providedAt: new Date(semester.startsAt.getTime() + 10 * 86400000) },
  });

  needyApplication = await applicationsService.create(studentAuth(needyUser), { type: 'TUITION', requestedAmount: 15000, reason: 'Irregular household earnings cannot clear the remaining tuition balance.' });
  needyApplication = await applicationsService.submit(studentAuth(needyUser), needyApplication.id);
  lowNeedApplication = await applicationsService.create(studentAuth(lowNeedUser), { type: 'TUITION', requestedAmount: 2500, reason: 'Temporary assistance is requested toward the small remaining tuition balance.' });
  lowNeedApplication = await applicationsService.submit(studentAuth(lowNeedUser), lowNeedApplication.id);
}, 60_000);

afterAll(async () => {
  if (customPolicy?.id) {
    await prisma.vettingPolicy.update({ where: { version: 'need-index-v1' }, data: { active: true } }).catch(() => {});
    await prisma.vettingPolicy.deleteMany({ where: { id: customPolicy.id } });
  }
  const studentIds = [needyStudent?.id, lowNeedStudent?.id].filter(Boolean);
  if (studentIds.length) {
    const applications = await prisma.assistanceApplication.findMany({ where: { studentId: { in: studentIds } }, select: { id: true } });
    const applicationIds = applications.map(({ id }) => id);
    const runs = await prisma.vettingRun.findMany({ where: { applicationId: { in: applicationIds } }, select: { id: true } });
    await prisma.vettingFactorResult.deleteMany({ where: { vettingRunId: { in: runs.map(({ id }) => id) } } });
    await prisma.vettingRun.deleteMany({ where: { applicationId: { in: applicationIds } } });
    await prisma.assistanceApplicationHistory.deleteMany({ where: { applicationId: { in: applicationIds } } });
    await prisma.assistanceApplication.deleteMany({ where: { id: { in: applicationIds } } });
    await prisma.studentAssistanceHistory.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.studentFinanceBlock.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.studentAidRecord.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.studentPayment.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.studentFinancialRecord.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
  }
  if (semester?.id) await prisma.examCalendar.deleteMany({ where: { semesterId: semester.id, programme } });
  const userIds = [needyUser?.id, lowNeedUser?.id, operatorUser?.id, outsiderUser?.id].filter(Boolean);
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}, 60_000);

describe('Section 16 explainable student vetting', () => {
  it('requires the vetting permission and calculates every evidence-backed Need Index factor', async () => {
    await expect(vettingService.execute(noPermissions(), needyApplication.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    verifiedRun = await vettingService.execute(operatorAuth(), needyApplication.id);
    expect(verifiedRun).toMatchObject({ applicationId: needyApplication.id, status: 'VERIFIED', score: '95' });
    expect(verifiedRun.factors).toHaveLength(7);
    expect(verifiedRun.factors.map(({ factor }) => factor).sort()).toEqual(['AID_RELIANCE','DUPLICATE_APPLICATION','EXAM_PERIOD_PAYMENT','FINANCE_BLOCK','MICRO_PAYMENT','PREVIOUS_ASSISTANCE','UNMET_BALANCE'].sort());
    expect(verifiedRun.explanation).toContain('Need Index of 95.00/100');
    expect(verifiedRun.factors.find(({ factor }) => factor === 'MICRO_PAYMENT')).toMatchObject({ outcome: 'PASS', points: '25', maximumPoints: '25' });
    expect(verifiedRun.factors.find(({ factor }) => factor === 'PREVIOUS_ASSISTANCE')).toMatchObject({ outcome: 'WARNING', points: '-5' });
  }, 30_000);

  it('persists an auditable application decision and returns the same run idempotently', async () => {
    const repeated = await vettingService.execute(operatorAuth(), needyApplication.id);
    expect(repeated.id).toBe(verifiedRun.id);
    expect(await prisma.vettingFactorResult.count({ where: { vettingRunId: verifiedRun.id } })).toBe(7);
    const application = await prisma.assistanceApplication.findUniqueOrThrow({ where: { id: needyApplication.id }, include: { history: { orderBy: { version: 'asc' } } } });
    expect(application.status).toBe('VERIFIED');
    expect(application.history.map(({ toStatus }) => toStatus)).toEqual(['DRAFT','SUBMITTED','VETTING','VERIFIED']);
    expect(application.history.at(-1).reason).toBe(`VETTING_RUN:${verifiedRun.id}`);
  }, 30_000);

  it('keeps private evidence restricted to the student and authorized reviewers', async () => {
    expect((await vettingService.get(studentAuth(needyUser), verifiedRun.id)).id).toBe(verifiedRun.id);
    expect((await vettingService.get(operatorAuth(), verifiedRun.id)).id).toBe(verifiedRun.id);
    await expect(vettingService.get(noPermissions(), verifiedRun.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  }, 30_000);

  it('rejects low-evidence applications instead of approving by assertion alone', async () => {
    const result = await vettingService.execute(operatorAuth(), lowNeedApplication.id);
    expect(result.status).toBe('INELIGIBLE');
    expect(Number(result.score)).toBeLessThan(45);
    const application = await prisma.assistanceApplication.findUniqueOrThrow({ where: { id: lowNeedApplication.id } });
    expect(application.status).toBe('REJECTED');
    expect(application.completedAt).toBeInstanceOf(Date);
  }, 30_000);

  it('validates and activates only authorized, versioned policies', async () => {
    const invalid = createVettingPolicySchema.safeParse({ version: 'invalid-policy', name: 'Invalid Policy', configuration: { ...DEFAULT_VETTING_POLICY, weights: { ...DEFAULT_VETTING_POLICY.weights, microPayment: 20 } } });
    expect(invalid.success).toBe(false);
    await expect(vettingPolicyService.create(noPermissions(), { version: `need-index-${run}`, name: 'Unauthorized policy', configuration: DEFAULT_VETTING_POLICY })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const parsed = createVettingPolicySchema.parse({ version: `need-index-${run}`, name: 'Need Index Test Policy', configuration: DEFAULT_VETTING_POLICY });
    customPolicy = await vettingPolicyService.create(policyManagerAuth(), parsed);
    expect(customPolicy).toMatchObject({ version: `need-index-${run}`, active: true, createdByUserId: operatorUser.id });
    expect((await prisma.vettingPolicy.findUniqueOrThrow({ where: { version: 'need-index-v1' } })).active).toBe(false);
  }, 30_000);
});
