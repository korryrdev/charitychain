import { prisma } from '@charitychain/database';
import { afterAll, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { studentsService } from '../../src/modules/students/students.service.js';
import { universityRecordsService } from '../../src/modules/universityRecords/universityRecords.service.js';
import { seedUniversityRecords } from '../../../database/prisma/seedUniversityRecords.js';

const run = Date.now();
let studentUser;
let otherUser;
let claimed;
const selfAuth = () => ({ user: studentUser, permissions: [PERMISSIONS.STUDENT_RECORD_READ_SELF] });
const otherAuth = () => ({ user: otherUser, permissions: [] });
const adminAuth = () => ({ user: otherUser, permissions: [PERMISSIONS.STUDENT_RECORD_READ_ALL, PERMISSIONS.STUDENT_RECORD_MANAGE] });

afterAll(async () => {
  const userIds = [studentUser?.id, otherUser?.id].filter(Boolean);
  if (userIds.length) {
    await prisma.student.updateMany({ where: { userId: { in: userIds } }, data: { userId: null } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
});

describe('Section 14 students and simulated university records', () => {
  it('seeds deterministic records for every configured financial profile', async () => {
    const first = await seedUniversityRecords({ count: 30 });
    const second = await seedUniversityRecords({ count: 30 });
    expect(second).toEqual(first);
    expect(first).toEqual({ version: 'must-financial-patterns-v1', students: 30, semesters: 4, profiles: 6 });
    expect(await prisma.student.count({ where: { registrationNumber: { startsWith: 'MUST/SIM/2026/' } } })).toBe(30);
    const grouped = await prisma.student.groupBy({ by: ['simulationProfile'], _count: { _all: true } });
    expect(grouped).toHaveLength(6);
    expect(grouped.every((entry) => entry._count._all === 5)).toBe(true);
    expect(await prisma.academicSemester.count()).toBeGreaterThanOrEqual(4);
    expect(await prisma.examCalendar.count()).toBeGreaterThanOrEqual(4);
  }, 180_000);

  it('materializes micro-payment, exam-distress, aid-gap, and control evidence correctly', async () => {
    const micro = await prisma.student.findUniqueOrThrow({ where: { registrationNumber: 'MUST/SIM/2026/001' }, include: { payments: true, aidRecords: true, financeBlocks: true, financialRecords: { include: { semester: true } } } });
    expect(micro.simulationProfile).toBe('MICRO_PAYMENT_HARDSHIP');
    expect(micro.payments.filter((payment) => payment.semesterId === micro.financialRecords.find((record) => record.semester.active).semesterId).map((payment) => payment.amount.toString()).sort()).toEqual(['1200','1500','3000','8000']);
    expect(micro.aidRecords.every((aid) => aid.aidType === 'HELB')).toBe(true);
    expect(micro.financeBlocks.every((block) => block.blockType === 'EXAM_CLEARANCE')).toBe(true);
    expect(micro.financialRecords.find((record) => record.semester.active).outstandingBalance.toString()).toBe('13300');

    const stable = await prisma.student.findUniqueOrThrow({ where: { registrationNumber: 'MUST/SIM/2026/005' }, include: { payments: true, financeBlocks: true, financialRecords: true } });
    expect(stable.simulationProfile).toBe('STABLE_LUMP_SUM_CONTROL');
    expect(stable.payments.every((payment) => payment.amount.toString() === '27000')).toBe(true);
    expect(stable.financeBlocks).toHaveLength(0);
    expect(stable.financialRecords.every((record) => record.status === 'CLEARED')).toBe(true);
  });

  it('claims one active registration record once and prevents account or record reuse', async () => {
    studentUser = (await authService.register({ name: 'Simulated Student', email: `student-${run}@example.test`, password: 'Section14-Strong-Password-42!' })).user;
    otherUser = (await authService.register({ name: 'Other Student', email: `other-student-${run}@example.test`, password: 'Section14-Strong-Password-42!' })).user;
    claimed = await studentsService.claim(selfAuth(), 'MUST/SIM/2026/001');
    expect(claimed).toMatchObject({ registrationNumber: 'MUST/SIM/2026/001', linked: true, simulationProfile: 'MICRO_PAYMENT_HARDSHIP' });
    expect(await studentsService.claim(selfAuth(), 'MUST/SIM/2026/001')).toEqual(claimed);
    await expect(studentsService.claim(otherAuth(), 'MUST/SIM/2026/001')).rejects.toMatchObject({ code: 'CONFLICT' });
    expect((await studentsService.mine(selfAuth())).id).toBe(claimed.id);
    expect(await prisma.userRole.count({ where: { userId: studentUser.id, role: { code: 'STUDENT' } } })).toBe(1);
  }, 30_000);

  it('returns a complete self record while enforcing cross-student privacy', async () => {
    const record = await universityRecordsService.mine(selfAuth());
    expect(record.student.registrationNumber).toBe('MUST/SIM/2026/001');
    expect(record.financialRecords).toHaveLength(4);
    expect(record.payments).toHaveLength(16);
    expect(record.aidRecords).toHaveLength(4);
    expect(record.financeBlocks).toHaveLength(4);
    expect(record.student).not.toHaveProperty('userId');
    await expect(universityRecordsService.get(otherAuth(), claimed.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await universityRecordsService.get(adminAuth(), claimed.id)).student.id).toBe(claimed.id);
    const exams = await universityRecordsService.exams(selfAuth(), claimed.id, '2025-2026-S2');
    expect(exams).toHaveLength(1);
    expect(exams[0].examType).toBe('END_SEMESTER');
  });

  it('supports privileged filtered listing without exposing financial details', async () => {
    const result = await studentsService.list(adminAuth(), { simulationProfile: 'AID_GAP_RELIANCE', page: 1, pageSize: 25 });
    expect(result.total).toBe(5);
    expect(result.items.every((student) => student.simulationProfile === 'AID_GAP_RELIANCE')).toBe(true);
    expect(result.items[0]).not.toHaveProperty('financialRecords');
  });
});
