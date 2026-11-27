import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { createApplicationsService } from '../../src/modules/applications/applications.service.js';
import { createVettingService } from '../../src/modules/vetting/vetting.service.js';
import { DEFAULT_VETTING_POLICY } from '../../src/modules/vetting/vettingPolicy.service.js';

describe('applications and vetting without a synced StudentFinancialRecord', () => {
  const studentAuth = {
    user: { id: 'user-1' },
    permissions: [PERMISSIONS.APPLICATION_CREATE, PERMISSIONS.APPLICATION_READ_SELF]
  };
  const student = {
    id: 'student-1',
    userId: 'user-1',
    registrationNumber: 'CT206/204483/24',
    fullName: 'Aldo Kipyegon',
    programme: 'BSc. in Computer Security and Forensics (BCSF)',
    academicStatus: 'ACTIVE',
    financialRecords: [],
    payments: [],
    aidRecords: [],
    financeBlocks: [],
    assistanceHistory: []
  };
  const semester = {
    id: 'sem-1',
    code: '2026-2027-S1',
    name: 'Semester 1',
    academicYear: '2026/2027',
    active: true
  };

  it('creates and submits an application with null financialRecordId and routes vetting to MANUAL_REVIEW', async () => {
    let storedApplication = null;
    const appRepo = {
      findStudentByUserId: vi.fn().mockResolvedValue(student),
      findSemester: vi.fn().mockResolvedValue(semester),
      findFinancialRecord: vi.fn().mockResolvedValue(null),
      findDuplicate: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (data) => {
        storedApplication = {
          id: 'app-1',
          ...data,
          currency: 'KES',
          status: 'DRAFT',
          version: 1,
          financialSnapshotAt: new Date(),
          submittedAt: null,
          cancelledAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          student,
          semester,
          history: [
            {
              fromStatus: null,
              toStatus: 'DRAFT',
              reason: 'APPLICATION_CREATED',
              version: 1,
              createdAt: new Date()
            }
          ]
        };
        return storedApplication;
      }),
      findById: vi.fn().mockImplementation(async () => storedApplication),
      transition: vi.fn().mockImplementation(async (application, toStatus, _actor, reason, extra) => {
        storedApplication = {
          ...application,
          ...extra,
          status: toStatus,
          version: application.version + 1,
          history: [
            ...application.history,
            {
              fromStatus: application.status,
              toStatus,
              reason,
              version: application.version + 1,
              createdAt: new Date()
            }
          ]
        };
        return storedApplication;
      })
    };

    const service = createApplicationsService(appRepo);
    const draft = await service.create(studentAuth, {
      type: 'TUITION',
      requestedAmount: 15000,
      reason: 'Tuition support is required because household income dropped this semester.',
      semesterCode: '2026-2027-S1'
    });
    expect(draft.financialSnapshot.financialRecordId).toBeNull();
    expect(draft.financialSnapshot.outstandingBalance).toBe('0');

    const submitted = await service.submit(studentAuth, draft.id);
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.financialSnapshot.financialRecordId).toBeNull();

    const policyRecord = {
      id: 'policy-1',
      version: 'need-index-v1',
      configuration: DEFAULT_VETTING_POLICY
    };
    const vettingRepo = {
      applicationContext: vi.fn().mockResolvedValue({
        application: { ...storedApplication, status: 'SUBMITTED' },
        currentFinancial: null,
        payments: [],
        aidRecords: [],
        financeBlocks: [],
        assistanceHistory: [],
        exams: [],
        otherApplications: []
      }),
      findRun: vi.fn().mockResolvedValue(null),
      createRun: vi.fn().mockResolvedValue({ id: 'run-1', applicationId: 'app-1', policyId: 'policy-1' }),
      startApplicationVetting: vi.fn().mockResolvedValue(storedApplication),
      completeRun: vi.fn().mockImplementation(async (run, result, factors) => ({
        id: run.id,
        applicationId: run.applicationId,
        status: result.outcome,
        score: new Prisma.Decimal(result.score),
        explanation: result.explanation,
        flags: result.flags,
        startedAt: new Date(),
        completedAt: new Date(),
        policy: policyRecord,
        application: { ...storedApplication, student, semester },
        factors: factors.map((f, idx) => ({
          id: `factor-${idx}`,
          ...f,
          points: new Prisma.Decimal(f.points),
          maximumPoints: new Prisma.Decimal(f.maximumPoints)
        }))
      })),
      failRun: vi.fn().mockResolvedValue(null)
    };

    const vetting = createVettingService({
      repository: vettingRepo,
      policies: { active: vi.fn().mockResolvedValue(policyRecord) }
    });
    const run = await vetting.execute(
      { user: { id: null }, permissions: [PERMISSIONS.VETTING_EXECUTE] },
      'app-1'
    );
    expect(run.status).toBe('MANUAL_REVIEW');
    expect(run.flags).toContain('UNVERIFIED_FINANCIAL_RECORD');
    expect(run.explanation).toContain('manual committee verification');
  });
});
