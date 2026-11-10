import { prisma } from '@charitychain/database';

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
    deleteUser(id) {
      return database.user.delete({ where: { id } });
    }
  };
}

export const authRepository = createAuthRepository();
