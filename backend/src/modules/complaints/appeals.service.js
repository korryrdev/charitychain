import { prisma } from '@charitychain/database';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

function toAppeal(appeal) { return { id: appeal.id, applicationId: appeal.applicationId, category: appeal.category, message: appeal.message, status: appeal.status, createdAt: appeal.createdAt, updatedAt: appeal.updatedAt }; }

export const appealsService = Object.freeze({
  async create(auth, input) {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) throw new AppError({ message: 'A linked student record is required to submit an appeal.', code: ERROR_CODES.STUDENT_NOT_FOUND, statusCode: 404 });
    if (input.applicationId) {
      const application = await prisma.assistanceApplication.findFirst({ where: { id: input.applicationId, studentId: student.id } });
      if (!application) throw new AppError({ message: 'Application not found.', code: ERROR_CODES.APPLICATION_NOT_FOUND, statusCode: 404 });
    }
    const id = randomUUID();
    await prisma.$executeRaw`INSERT INTO "student_appeals" ("id", "studentId", "applicationId", "category", "message", "status", "updatedAt") VALUES (${id}::uuid, ${student.id}::uuid, ${input.applicationId ?? null}::uuid, ${input.category}, ${input.message}, 'OPEN', CURRENT_TIMESTAMP)`;
    const [appeal] = await prisma.$queryRaw`SELECT "id", "applicationId", "category", "message", "status", "createdAt", "updatedAt" FROM "student_appeals" WHERE "id" = ${id}::uuid`;
    return toAppeal(appeal);
  },
  async mine(auth) {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) throw new AppError({ message: 'A linked student record is required.', code: ERROR_CODES.STUDENT_NOT_FOUND, statusCode: 404 });
    return (await prisma.$queryRaw`SELECT "id", "applicationId", "category", "message", "status", "createdAt", "updatedAt" FROM "student_appeals" WHERE "studentId" = ${student.id}::uuid ORDER BY "createdAt" DESC`).map(toAppeal);
  }
});
