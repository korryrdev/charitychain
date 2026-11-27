import { prisma } from '@charitychain/database';
import { findMustProgramme, findMustSchool } from '@charitychain/shared';
import { AppError } from '../../errors/AppError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { ValidationError } from '../../errors/ValidationError.js';

export function createAuthRepository(database = prisma) {
  return {
    findUserByEmail(email) {
      return database.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          roles: {
            include: { role: { include: { permissions: { include: { permission: true } } } } }
          }
        }
      });
    },
    findUserById(id) {
      return database.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: { role: { include: { permissions: { include: { permission: true } } } } }
          }
        }
      });
    },
    findSessionByToken(token) {
      return database.session.findUnique({ where: { token } });
    },
    revokeSessionByToken(token) {
      if (!token) return Promise.resolve({ count: 0 });
      return database.session.deleteMany({ where: { token } });
    },
    createVerification(data) {
      return database.verification.create({ data });
    },
    consumeVerification(identifier, value, now = new Date()) {
      return database.$transaction(async (transaction) => {
        const record = await transaction.verification.findFirst({
          where: { identifier, value, expiresAt: { gt: now } },
          orderBy: { createdAt: 'desc' }
        });
        if (!record) return null;
        await transaction.verification.delete({ where: { id: record.id } });
        return record;
      });
    },
    deleteVerifications(identifier) {
      return database.verification.deleteMany({ where: { identifier } });
    },
    activateUser(email) {
      return database.user.update({
        where: { email: email.toLowerCase() },
        data: { status: 'ACTIVE', emailVerified: true }
      });
    },
    findCredentialAccount(userId) {
      return database.account.findFirst({ where: { userId, providerId: 'credential' } });
    },
    markTemporaryPassword(userId, expiresAt) {
      return database.user.update({
        where: { id: userId },
        data: { mustChangePassword: true, temporaryPasswordExpiresAt: expiresAt }
      });
    },
    clearPasswordChangeRequirement(userId) {
      return database.user.update({
        where: { id: userId },
        data: { mustChangePassword: false, temporaryPasswordExpiresAt: null }
      });
    },
    revokeSessionsExcept(userId, exceptToken = null) {
      return database.session.deleteMany({
        where: { userId, ...(exceptToken ? { token: { not: exceptToken } } : {}) }
      });
    },
    updateCredentialPassword(userId, password) {
      return database.account.updateMany({
        where: { userId, providerId: 'credential' },
        data: { password }
      });
    },
    assignDefaultRole(userId, roleCode = 'DONOR') {
      return database.$transaction(async (transaction) => {
        const role = await transaction.role.findUniqueOrThrow({ where: { code: roleCode } });
        return transaction.userRole.upsert({
          where: { userId_roleId: { userId, roleId: role.id } },
          update: {},
          create: { userId, roleId: role.id }
        });
      });
    },
    ensureStudentProfile(userId, fullName, registrationNumber, academicDetails) {
      return database.$transaction(async (transaction) => {
        const existing = await transaction.student.findUnique({ where: { userId } });
        const normalizedReg = registrationNumber?.trim().toUpperCase();
        if (normalizedReg) {
          const requested = await transaction.student.findUnique({
            where: { registrationNumber: normalizedReg }
          });
          if (requested) {
            if (requested.academicStatus !== 'ACTIVE') {
              throw new AppError({
                message: 'Student record not found.',
                code: ERROR_CODES.STUDENT_NOT_FOUND,
                statusCode: 404
              });
            }
            if (requested.userId && requested.userId !== userId) {
              throw new ConflictError('Student record is already linked to another account.');
            }
            if (existing && existing.id !== requested.id) {
              throw new ConflictError('This account is already linked to another student record.');
            }
            if (requested.userId === userId) return requested;
            return transaction.student.update({
              where: { id: requested.id },
              data: { userId, ...(fullName ? { fullName } : {}) }
            });
          }
          if (existing) {
            throw new ConflictError('This account is already linked to another student record.');
          }
          const rawSchool = academicDetails?.school?.trim();
          const rawProgramme = academicDetails?.programme?.trim();
          const yearOfStudy = Number(academicDetails?.yearOfStudy);
          if (!rawSchool || !rawProgramme || !Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 5) {
            throw new ValidationError('School, programme, and year of study are required.', [
              { path: 'school', message: 'School, programme, and year of study are required.', code: 'custom' }
            ]);
          }
          const matchedSchool = findMustSchool(rawSchool);
          const matchedProgramme = matchedSchool ? findMustProgramme(matchedSchool.code, rawProgramme) : null;
          const schoolName = matchedSchool?.name ?? rawSchool;
          const programmeName = matchedProgramme?.name ?? rawProgramme;
          const durationYears = matchedProgramme?.durationYears ?? (yearOfStudy > 4 ? 5 : 4);
          const now = new Date();
          const admittedAt = new Date(Date.UTC(now.getUTCFullYear() - (yearOfStudy - 1), 8, 1));
          const expectedGraduation = new Date(
            Date.UTC(admittedAt.getUTCFullYear() + durationYears, 5, 30)
          );
          return transaction.student.create({
            data: {
              userId,
              registrationNumber: normalizedReg,
              fullName: fullName || normalizedReg,
              programme: programmeName,
              school: schoolName,
              yearOfStudy,
              academicStatus: 'ACTIVE',
              simulationProfile: 'MIXED_CONTROL',
              admittedAt,
              expectedGraduation
            }
          });
        }
        if (existing) return existing;
        const unlinked = await transaction.student.findFirst({
          where: { userId: null, academicStatus: 'ACTIVE' },
          orderBy: { registrationNumber: 'asc' }
        });
        if (!unlinked) return null;
        return transaction.student.update({
          where: { id: unlinked.id },
          data: { userId, ...(fullName ? { fullName } : {}) }
        });
      });
    },
    deleteUser(id) {
      return database.user.delete({ where: { id } });
    }
  };
}

export const authRepository = createAuthRepository();
