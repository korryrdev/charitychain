import { prisma } from '@charitychain/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { createDisbursementsService } from '../../src/modules/disbursements/disbursements.service.js';
import { createTuitionDisbursementService } from '../../src/modules/disbursements/tuitionDisbursement.service.js';
import { createUpkeepDisbursementService } from '../../src/modules/disbursements/upkeepDisbursement.service.js';

const run = Date.now();
const tuitionCalls = [];
const upkeepCalls = [];
let upkeepFailuresRemaining = 1;
const tuitionProvider = { async send(payload) { tuitionCalls.push(payload); return { providerRequestId: `B2B-${run}-${tuitionCalls.length}`, response: { ResponseCode: '0' } }; } };
const upkeepProvider = { async send(payload) { upkeepCalls.push(payload); if (upkeepFailuresRemaining-- > 0) throw new Error('Simulated provider transport failure.'); return { providerRequestId: `B2C-${run}-${upkeepCalls.length}`, response: { ResponseCode: '0' } }; } };
const config = { callbackSecret: `callback-secret-${run}`, universityShortcode: '123456', universityAccount: 'MUST-FEES' };
const service = createDisbursementsService({ tuition: createTuitionDisbursementService(tuitionProvider), upkeep: createUpkeepDisbursementService(upkeepProvider), config });
let operator;
let tuitionStudentUser;
let upkeepStudentUser;
let tuitionStudent;
let upkeepStudent;
let tuitionApplication;
let upkeepApplication;
let tuitionDisbursement;
let upkeepDisbursement;

const operatorAuth = () => ({ user: operator, permissions: [PERMISSIONS.DISBURSEMENT_CREATE, PERMISSIONS.DISBURSEMENT_EXECUTE, PERMISSIONS.DISBURSEMENT_READ] });
const noPermissions = () => ({ user: operator, permissions: [] });
async function register(name) { return (await authService.register({ name, email: `${name.toLowerCase().replaceAll(' ','-')}-${run}@example.test`, password: 'Section19-Strong-Password-42!' })).user; }
async function createApprovedApplication({ user, semester, type, index, phone }) {
  const student = await prisma.student.create({ data: { userId: user.id, registrationNumber: `MUST/DISB/${run}/${index}`, fullName: `Disbursement Student ${index}`, programme: 'BSC-DISBURSEMENT-TEST', school: 'School of Computing and Informatics', yearOfStudy: 3, academicStatus: 'ACTIVE', simulationProfile: 'MICRO_PAYMENT_HARDSHIP', admittedAt: new Date('2023-09-01'), expectedGraduation: new Date('2027-06-30'), verifiedPhone: phone, phoneVerifiedAt: phone ? new Date() : null } });
  const financial = await prisma.studentFinancialRecord.create({ data: { studentId: student.id, semesterId: semester.id, invoicedAmount: 30000, paidAmount: 5000, aidAmount: 8000, outstandingBalance: 25000, status: 'BLOCKED' } });
  const application = await prisma.assistanceApplication.create({ data: { reference: `APP-DISB-${run}-${index}`, studentId: student.id, semesterId: semester.id, type, requestedAmount: type === 'TUITION' ? 20000 : 8000, reason: `Approved ${type.toLowerCase()} assistance for disbursement integration verification.`, status: 'APPROVED', financialRecordId: financial.id, outstandingBalanceSnapshot: 25000, submittedAt: new Date(), version: 6 } });
  await prisma.approvalRound.create({ data: { applicationId: application.id, sequence: 1, applicationVersion: 6, evidenceDigest: `approved-disbursement-${run}-${index}`, status: 'APPROVED', threshold: 2, closedAt: new Date() } });
  return { student, financial, application };
}

beforeAll(async () => {
  [operator, tuitionStudentUser, upkeepStudentUser] = await Promise.all([register('Disbursement Operator'), register('Tuition Payout Student'), register('Upkeep Payout Student')]);
  const semester = await prisma.academicSemester.findFirstOrThrow({ where: { active: true }, orderBy: { startsAt: 'desc' } });
  const tuition = await createApprovedApplication({ user: tuitionStudentUser, semester, type: 'TUITION', index: 1 });
  const upkeep = await createApprovedApplication({ user: upkeepStudentUser, semester, type: 'UPKEEP', index: 2 });
  tuitionStudent = tuition.student; tuitionApplication = tuition.application;
  upkeepStudent = upkeep.student; upkeepApplication = upkeep.application;
}, 60_000);

afterAll(async () => {
  const applicationIds = [tuitionApplication?.id, upkeepApplication?.id].filter(Boolean);
  const disbursements = await prisma.disbursement.findMany({ where: { applicationId: { in: applicationIds } }, select: { id: true } });
  const disbursementIds = disbursements.map(({ id }) => id);
  await prisma.disbursementProviderEvent.deleteMany({ where: { disbursementId: { in: disbursementIds } } });
  await prisma.disbursementAttempt.deleteMany({ where: { disbursementId: { in: disbursementIds } } });
  await prisma.disbursement.deleteMany({ where: { id: { in: disbursementIds } } });
  await prisma.approvalRound.deleteMany({ where: { applicationId: { in: applicationIds } } });
  await prisma.assistanceApplicationHistory.deleteMany({ where: { applicationId: { in: applicationIds } } });
  await prisma.assistanceApplication.deleteMany({ where: { id: { in: applicationIds } } });
  const studentIds = [tuitionStudent?.id, upkeepStudent?.id].filter(Boolean);
  await prisma.studentFinancialRecord.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [operator, tuitionStudentUser, upkeepStudentUser].filter(Boolean).map(({ id }) => id) } } });
}, 60_000);

describe('Section 19 monetary disbursements', () => {
  it('requires approved applications, permissions and a verified upkeep phone', async () => {
    await expect(service.create(noPermissions(), tuitionApplication.id, { idempotencyKey: `tuition-${run}-unauthorized` })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(service.create(operatorAuth(), upkeepApplication.id, { idempotencyKey: `upkeep-${run}-verified-phone` })).rejects.toMatchObject({ code: 'CONFLICT' });
    await prisma.student.update({ where: { id: upkeepStudent.id }, data: { verifiedPhone: '254712345678', phoneVerifiedAt: new Date() } });
  }, 30_000);

  it('initiates tuition B2B exactly once with registration-number reference', async () => {
    tuitionDisbursement = await service.createAndExecute(operatorAuth(), tuitionApplication.id, { idempotencyKey: `tuition-${run}-primary` });
    expect(tuitionDisbursement).toMatchObject({ type: 'TUITION_B2B', status: 'PROCESSING', destination: '123456', destinationReference: tuitionStudent.registrationNumber, amount: '20000', attemptCount: 1 });
    expect(tuitionCalls).toHaveLength(1);
    const replay = await service.createAndExecute(operatorAuth(), tuitionApplication.id, { idempotencyKey: `tuition-${run}-primary` });
    expect(replay.id).toBe(tuitionDisbursement.id);
    expect(tuitionCalls).toHaveLength(1);
  }, 30_000);

  it('authenticates callbacks, completes funding once and rejects altered replay', async () => {
    const callback = { providerEventId: `EVENT-TUITION-${run}`, providerRequestId: tuitionDisbursement.providerRequestId, resultCode: '0', resultMessage: 'The service request is processed successfully.', transactionId: `TX-TUITION-${run}`, amount: 20000, completedAt: new Date(), raw: { ResultType: 0 } };
    await expect(service.callback('wrong-secret', callback)).rejects.toMatchObject({ code: 'CALLBACK_INVALID' });
    tuitionDisbursement = await service.callback(config.callbackSecret, callback);
    expect(tuitionDisbursement).toMatchObject({ status: 'SUCCEEDED', providerTransactionId: `TX-TUITION-${run}` });
    expect(tuitionDisbursement.receiptHash).toMatch(/^[a-f0-9]{64}$/);
    expect((await prisma.assistanceApplication.findUniqueOrThrow({ where: { id: tuitionApplication.id } })).status).toBe('FUNDED');
    expect((await service.callback(config.callbackSecret, callback)).id).toBe(tuitionDisbursement.id);
    await expect(service.callback(config.callbackSecret, { ...callback, resultMessage: 'Altered replay content.' })).rejects.toMatchObject({ code: 'CALLBACK_INVALID' });
  }, 30_000);

  it('persists provider failures and recovers through bounded retry', async () => {
    await expect(service.createAndExecute(operatorAuth(), upkeepApplication.id, { idempotencyKey: `upkeep-${run}-primary` })).rejects.toMatchObject({ code: 'DISBURSEMENT_FAILED', retryable: true });
    upkeepDisbursement = await service.getForApplication(operatorAuth(), upkeepApplication.id);
    expect(upkeepDisbursement).toMatchObject({ type: 'UPKEEP_B2C', status: 'FAILED', attemptCount: 1, destination: '254712345678' });
    upkeepDisbursement = await service.execute(operatorAuth(), upkeepDisbursement.id);
    expect(upkeepDisbursement).toMatchObject({ status: 'PROCESSING', attemptCount: 2 });
    upkeepDisbursement = await service.callback(config.callbackSecret, { providerEventId: `EVENT-UPKEEP-FAIL-${run}`, providerRequestId: upkeepDisbursement.providerRequestId, resultCode: '2001', resultMessage: 'Recipient unavailable.', amount: 8000, completedAt: new Date(), raw: { ResultType: 2001 } });
    expect(upkeepDisbursement).toMatchObject({ status: 'FAILED', failureCode: '2001' });
    upkeepDisbursement = await service.execute(operatorAuth(), upkeepDisbursement.id);
    expect(upkeepDisbursement).toMatchObject({ status: 'PROCESSING', attemptCount: 3 });
    upkeepDisbursement = await service.callback(config.callbackSecret, { providerEventId: `EVENT-UPKEEP-SUCCESS-${run}`, providerRequestId: upkeepDisbursement.providerRequestId, resultCode: '0', resultMessage: 'Successful.', transactionId: `TX-UPKEEP-${run}`, amount: 8000, completedAt: new Date(), raw: { ResultType: 0 } });
    expect(upkeepDisbursement.status).toBe('SUCCEEDED');
    expect((await prisma.assistanceApplication.findUniqueOrThrow({ where: { id: upkeepApplication.id } })).status).toBe('FUNDED');
    await expect(service.execute(operatorAuth(), upkeepDisbursement.id)).rejects.toMatchObject({ code: 'CONFLICT' });
  }, 30_000);

  it('preserves append-only attempts, callbacks and application history', async () => {
    expect(await prisma.disbursementAttempt.count({ where: { disbursementId: upkeepDisbursement.id } })).toBe(3);
    expect(await prisma.disbursementProviderEvent.count({ where: { disbursementId: upkeepDisbursement.id } })).toBe(2);
    const history = await prisma.assistanceApplicationHistory.findMany({ where: { applicationId: upkeepApplication.id }, orderBy: { version: 'asc' } });
    expect(history.map(({ toStatus }) => toStatus)).toEqual(['DISBURSEMENT_PENDING','FUNDED']);
    expect((await service.get(operatorAuth(), upkeepDisbursement.id)).attempts.map(({ status }) => status)).toEqual(['FAILED','FAILED','SUCCEEDED']);
  }, 30_000);
});
