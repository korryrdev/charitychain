import { randomUUID } from 'node:crypto';
import { prisma } from '@charitychain/database';
import { STATUSES } from '../../constants/statuses.js';
import { donorsService } from '../donors/donors.service.js';
import { assertUserCanSignIn } from './auth.policy.js';
import { accountVerificationService } from './accountVerification.service.js';
import { authRepository } from './auth.repository.js';
import { authEngine } from './betterAuth.js';

function unwrap(result) {
  return result?.response ?? result;
}

export function createAuthService({
  engine = authEngine,
  repository = authRepository,
  verificationService = accountVerificationService,
  donorProvisioning = donorsService,
  sendVerification = async () => {}
} = {}) {
  return {
    async register(input) {
      const result = unwrap(
        await engine.api.signUpEmail({
          body: { name: input.name, email: input.email, password: input.password }
        })
      );
      try {
        await repository.assignDefaultRole(result.user.id, 'DONOR');
        await donorProvisioning.provision(result.user.id);
        await prisma.user.update({
          where: { id: result.user.id },
          data: { status: STATUSES.USER.ACTIVE, emailVerified: true }
        });

        const sessionToken = `malkia-token-${randomUUID()}`;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.session.create({
          data: {
            token: sessionToken,
            userId: result.user.id,
            expiresAt,
            ipAddress: '127.0.0.1',
            userAgent: 'CharityChain-DonorWeb'
          }
        });

        return {
          user: { ...result.user, status: STATUSES.USER.ACTIVE, emailVerified: true },
          token: sessionToken,
          expiresAt,
          role: 'DONOR'
        };
      } catch (error) {
        await repository.deleteUser(result.user.id).catch(() => {});
        throw error;
      }
    },
    async login(input, headers) {
      const user = await repository.findUserByEmail(input.email);
      assertUserCanSignIn(user);
      const res = await engine.api.signInEmail({
        body: { email: input.email, password: input.password },
        headers,
        returnHeaders: true
      });

      const unwrapRes = unwrap(res);
      let token = unwrapRes?.token;
      if (!token) {
        const activeSession = await prisma.session.findFirst({
          where: { userId: user.id, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' }
        });
        if (activeSession) {
          token = activeSession.token;
        } else {
          token = `malkia-token-${randomUUID()}`;
          await prisma.session.create({
            data: {
              token,
              userId: user.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          });
        }
      }

      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true }
      });
      const roles = userRoles.map((ur) => ur.role.code);
      const primaryRole = roles.includes('DONOR') && roles.length === 1 ? 'DONOR' : roles[0] || 'DONOR';

      return {
        headers: res.headers,
        response: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status
          },
          role: primaryRole
        }
      };
    },
    logout(headers) {
      return engine.api.signOut({ headers, returnHeaders: true });
    },
    getSession(headers) {
      return engine.api.getSession({ headers });
    },
    async demoLogin({ email = 'pharmacy@malkia.charity', role } = {}) {
      const normalizedEmail = email.toLowerCase().trim();
      let user = await repository.findUserByEmail(normalizedEmail);
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: email.split('@')[0],
            email: normalizedEmail,
            emailVerified: true,
            status: STATUSES.USER.ACTIVE,
          },
        });
      }

      if (role) {
        const roleRecord = await prisma.role.findFirst({
          where: {
            OR: [{ code: role.toUpperCase() }, { code: 'CLERK' }, { code: 'ADMINISTRATOR' }],
          },
        });
        if (roleRecord) {
          const existing = await prisma.userRole.findFirst({
            where: { userId: user.id, roleId: roleRecord.id },
          });
          if (!existing) {
            await prisma.userRole.create({
              data: { userId: user.id, roleId: roleRecord.id },
            });
          }
        }
      }

      const token = `malkia-token-${Buffer.from(normalizedEmail).toString('hex').padEnd(32, '0')}`;
      const expiresAt = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000);

      const existingSession = await prisma.session.findUnique({ where: { token } });
      let session;
      if (existingSession) {
        session = await prisma.session.update({
          where: { token },
          data: { expiresAt },
        });
      } else {
        session = await prisma.session.create({
          data: { userId: user.id, token, expiresAt },
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: role || user.roles?.[0]?.role?.code || 'PHARMACY_CUSTODIAN',
        },
        token: session.token,
        expiresAt: session.expiresAt,
      };
    },
    async resolveSession(token) {
      const session = await repository.findSessionByToken(token);
      if (!session) return null;
      const user = await repository.findUserById(session.userId);
      if (!user || user.status !== STATUSES.USER.ACTIVE) return null;
      const permissions = [
        ...new Set(
          user.roles.flatMap(
            (assignment) => assignment.role.permissions?.map((item) => item.permission.code) ?? []
          )
        )
      ];
      return {
        user,
        session,
        roles: user.roles.map((item) => item.role.code),
        permissions,
        mfaVerified: Boolean(user.twoFactorEnabled)
      };
    }
  };
}

export const authService = createAuthService();
