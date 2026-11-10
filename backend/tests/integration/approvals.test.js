import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { approvalsService } from '../../src/modules/approvals/approvals.service.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { conflictOfInterestService } from '../../src/modules/committee/conflictOfInterest.service.js';
import { membershipService } from '../../src/modules/committee/membership.service.js';

const run = Date.now();
let manager;
let chair;
let treasurer;
let secretary;
let outsider;
let semester;
let policy;
const memberships = [];
const students = [];
const applications = [];
let approvalRound;
let invalidationRound;

const managerAuth = () => ({ user: manager, permissions: [PERMISSIONS.APPLICATION_REVIEW, PERMISSIONS.COMMITTEE_MANAGE] });
const signerAuth = (user) => ({ user, permissions: [PERMISSIONS.APPLICATION_APPROVE] });
const noPermissions = () => ({ user: outsider, permissions: [] });
const term = () => ({ termStartsAt: new Date(Date.now() - 86400000), termEndsAt: new Date(Date.now() + 365 * 86400000), reason: 'Executive committee signatory appointed for approval workflow verification.' });

async function register(name) { return (await authService.register({ name, email: `${name.toLowerCase().replaceAll(' ','-')}-${run}@example.test`, password: 'Section18-Strong-Password-42!' })).user; }
async function createVerifiedApplication(index) {
  const user = await register(`Approval Student ${index}`);
  const student = await prisma.student.create({ data: { userId: user.id, registrationNumber: `MUST/APPROVAL/${run}/${index}`, fullName: `Approval Student ${index}`, programme: 'BSC-APPROVAL-TEST', school: 'School of Computing and Informatics', yearOfStudy: 3, academicStatus: 'ACTIVE', simulationProfile: 'MICRO_PAYMENT_HARDSHIP', admittedAt: new Date('2023-09-01'), expectedGraduation: new Date('2027-06-30') } });
  const financial = await prisma.studentFinancialRecord.create({ data: { studentId: student.id, semesterId: semester.id, invoicedAmount: 30000, paidAmount: 5000, aidAmount: 8000, outstandingBalance: 25000, status: 'BLOCKED' } });
  const application = await prisma.assistanceApplication.create({ data: { reference: `APP-APPROVAL-${run}-${index}`, studentId: student.id, semesterId: semester.id, type: 'TUITION', requestedAmount: 20000, reason: `Verified financial hardship application number ${index} for committee approval.`, status: 'VERIFIED', financialRecordId: financial.id, outstandingBalanceSnapshot: 25000, submittedAt: new Date(), version: 4 } });
  const vetting = await prisma.vettingRun.create({ data: { applicationId: application.id, policyId: policy.id, status: 'VERIFIED', score: 95, inputDigest: `approval-vetting-${run}-${index}`, explanation: 'Verified by the explainable Need Index.', flags: [], completedAt: new Date() } });
  await prisma.vettingFactorResult.create({ data: { vettingRunId: vetting.id, factor: 'UNMET_BALANCE', outcome: 'PASS', points: 30, maximumPoints: 30, rawValue: { outstandingBalance: 25000 }, evidence: [{ financialRecordId: financial.id }], explanation: 'High unmet balance verified.' } });
  students.push({ user, student, financial, vetting });
  applications.push(application);
  return application;
}

beforeAll(async () => {
  [manager, chair, treasurer, secretary, outsider] = await Promise.all([register('Approval Manager'), register('Approval Chair'), register('Approval Treasurer'), register('Approval Secretary'), register('Approval Outsider')]);
  await prisma.user.updateMany({ where: { id: { in: [manager.id, chair.id, treasurer.id, secretary.id] } }, data: { status: 'ACTIVE', emailVerified: true, twoFactorEnabled: true } });
  semester = await prisma.academicSemester.findFirstOrThrow({ where: { active: true }, orderBy: { startsAt: 'desc' } });
  policy = await prisma.vettingPolicy.findFirstOrThrow({ where: { active: true }, orderBy: { createdAt: 'desc' } });
  memberships.push(
    await membershipService.appoint(managerAuth(), { userId: chair.id, seat: 'CHAIRPERSON', ...term() }),
    await membershipService.appoint(managerAuth(), { userId: treasurer.id, seat: 'TREASURER', ...term() }),
    await membershipService.appoint(managerAuth(), { userId: secretary.id, seat: 'SECRETARY', ...term() })
  );
  await Promise.all([createVerifiedApplication(1), createVerifiedApplication(2), createVerifiedApplication(3)]);
}, 90_000);

afterAll(async () => {
  const applicationIds = applications.map(({ id }) => id);
  const rounds = applicationIds.length ? await prisma.approvalRound.findMany({ where: { applicationId: { in: applicationIds } }, select: { id: true } }) : [];
  await prisma.approvalDecision.deleteMany({ where: { roundId: { in: rounds.map(({ id }) => id) } } });
  await prisma.approvalRound.deleteMany({ where: { id: { in: rounds.map(({ id }) => id) } } });
  await prisma.committeeConflict.deleteMany({ where: { applicationId: { in: applicationIds } } });
  for (const item of students) await prisma.vettingFactorResult.deleteMany({ where: { vettingRunId: item.vetting.id } });
  await prisma.vettingRun.deleteMany({ where: { applicationId: { in: applicationIds } } });
  await prisma.assistanceApplicationHistory.deleteMany({ where: { applicationId: { in: applicationIds } } });
  await prisma.assistanceApplication.deleteMany({ where: { id: { in: applicationIds } } });
  const membershipIds = memberships.map(({ id }) => id);
  await prisma.committeeMembershipHistory.deleteMany({ where: { membershipId: { in: membershipIds } } });
  await prisma.committeeMembership.deleteMany({ where: { id: { in: membershipIds } } });
  const studentIds = students.map(({ student }) => student.id);
  await prisma.studentFinancialRecord.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
  const ids = [manager, chair, treasurer, secretary, outsider, ...students.map(({ user }) => user)].filter(Boolean).map(({ id }) => id);
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}, 90_000);

describe('Section 18 two-out-of-three committee approvals', () => {
  it('opens a digest-bound approval round only for verified and vetted applications', async () => {
    await expect(approvalsService.open(noPermissions(), applications[0].id, { reason: 'Unauthorized opening must fail.' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    approvalRound = await approvalsService.open(managerAuth(), applications[0].id, { reason: 'Verified application released to the executive committee for decision.' });
    expect(approvalRound).toMatchObject({ applicationId: applications[0].id, sequence: 1, status: 'OPEN', threshold: 2, approvals: 0, declines: 0 });
    expect(approvalRound.evidenceDigest).toMatch(/^[a-f0-9]{64}$/);
    expect((await prisma.assistanceApplication.findUniqueOrThrow({ where: { id: applications[0].id } })).status).toBe('AWAITING_APPROVALS');
    await expect(approvalsService.open(managerAuth(), applications[0].id, { reason: 'An already open application cannot be opened a second time.' })).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);

  it('excludes conflicted signatories and prevents duplicate decisions', async () => {
    const conflict = await conflictOfInterestService.declare(signerAuth(chair), applications[0].id, { membershipId: memberships[0].id, type: 'FAMILY_RELATIONSHIP', description: 'The chairperson has an immediate family relationship with the applicant.' });
    await expect(approvalsService.decide(signerAuth(chair), approvalRound.id, { decision: 'APPROVE', rationale: 'This decision must be blocked by the unresolved conflict.' })).rejects.toMatchObject({ code: 'APPROVAL_CONFLICT' });
    expect(conflict.status).toBe('DECLARED');
    approvalRound = await approvalsService.decide(signerAuth(treasurer), approvalRound.id, { decision: 'APPROVE', rationale: 'Financial evidence and the Need Index independently support assistance.' });
    expect(approvalRound).toMatchObject({ status: 'OPEN', approvals: 1, declines: 0 });
    await expect(approvalsService.decide(signerAuth(treasurer), approvalRound.id, { decision: 'APPROVE', rationale: 'A signatory cannot submit a second decision in the same round.' })).rejects.toMatchObject({ code: 'APPROVAL_DUPLICATE' });
  }, 30_000);

  it('approves only when two distinct eligible signatories approve', async () => {
    approvalRound = await approvalsService.decide(signerAuth(secretary), approvalRound.id, { decision: 'APPROVE', rationale: 'The verified evidence supports direct tuition assistance for this student.' });
    expect(approvalRound).toMatchObject({ status: 'APPROVED', approvals: 2, declines: 0 });
    expect(approvalRound.decisions.map(({ seat }) => seat).sort()).toEqual(['SECRETARY','TREASURER']);
    const application = await prisma.assistanceApplication.findUniqueOrThrow({ where: { id: applications[0].id }, include: { history: { orderBy: { version: 'asc' } } } });
    expect(application.status).toBe('APPROVED');
    expect(application.history.map(({ toStatus }) => toStatus)).toEqual(['AWAITING_APPROVALS','APPROVED']);
    await expect(approvalsService.decide(signerAuth(chair), approvalRound.id, { decision: 'DECLINE', rationale: 'Closed approval rounds cannot accept any additional decisions.' })).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);

  it('declines when two signatories decline and preserves every rationale', async () => {
    let round = await approvalsService.open(managerAuth(), applications[1].id, { reason: 'Second verified application released for an independent committee decision.' });
    round = await approvalsService.decide(signerAuth(chair), round.id, { decision: 'DECLINE', rationale: 'The requested amount is not sufficiently justified by the reviewed evidence.' });
    round = await approvalsService.decide(signerAuth(treasurer), round.id, { decision: 'DECLINE', rationale: 'Independent review agrees that the current evidence does not justify funding.' });
    expect(round).toMatchObject({ status: 'DECLINED', approvals: 0, declines: 2 });
    expect(round.decisions.every(({ digest }) => digest === round.evidenceDigest)).toBe(true);
    const application = await prisma.assistanceApplication.findUniqueOrThrow({ where: { id: applications[1].id } });
    expect(application.status).toBe('DECLINED');
    expect(application.completedAt).toBeInstanceOf(Date);
  }, 30_000);

  it('invalidates signatures after material evidence changes and permits a new digest round', async () => {
    invalidationRound = await approvalsService.open(managerAuth(), applications[2].id, { reason: 'Third verified application released for committee review and digest testing.' });
    await prisma.assistanceApplication.update({ where: { id: applications[2].id }, data: { reason: 'Materially changed application reason after the approval round was opened.' } });
    await expect(approvalsService.decide(signerAuth(chair), invalidationRound.id, { decision: 'APPROVE', rationale: 'This signature must be rejected because its evidence digest is now stale.' })).rejects.toMatchObject({ code: 'APPROVAL_CONFLICT' });
    invalidationRound = await approvalsService.get(managerAuth(), invalidationRound.id);
    expect(invalidationRound).toMatchObject({ status: 'INVALIDATED', approvals: 0, declines: 0, invalidationReason: 'MATERIAL_APPLICATION_OR_VETTING_EVIDENCE_CHANGED' });
    expect((await prisma.assistanceApplication.findUniqueOrThrow({ where: { id: applications[2].id } })).status).toBe('VERIFIED');
    const replacement = await approvalsService.open(managerAuth(), applications[2].id, { reason: 'Material change reviewed; a replacement committee round is now required.' });
    expect(replacement.sequence).toBe(2);
    expect(replacement.evidenceDigest).not.toBe(invalidationRound.evidenceDigest);
    await approvalsService.decide(signerAuth(treasurer), replacement.id, { decision: 'APPROVE', rationale: 'Initial replacement-round review supports assistance on the revised evidence.' });
    await conflictOfInterestService.declare(signerAuth(treasurer), applications[2].id, { membershipId: memberships[1].id, type: 'FINANCIAL_INTEREST', description: 'A financial conflict was discovered after the first replacement-round signature.' });
    await expect(approvalsService.decide(signerAuth(secretary), replacement.id, { decision: 'APPROVE', rationale: 'The prior conflicted signature must prevent this decision reaching threshold.' })).rejects.toMatchObject({ code: 'APPROVAL_CONFLICT' });
    const listed = await approvalsService.list(managerAuth(), applications[2].id);
    expect(listed.map(({ status }) => status)).toEqual(['INVALIDATED','INVALIDATED']);
    expect(listed[0].invalidationReason).toBe('SIGNATORY_CONFLICT_DISCOVERED');
  }, 30_000);
});
