import { prisma } from '@charitychain/database';
import { AppError } from '../../errors/AppError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

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
    ensureStudentProfile(userId, fullName, registrationNumber) {
      return database.$transaction(async (transaction) => {
        const existing = await transaction.student.findUnique({ where: { userId } });
        if (registrationNumber) {
          const requested = await transaction.student.findUnique({ where: { registrationNumber } });
          if (!requested || requested.academicStatus !== 'ACTIVE') {
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
