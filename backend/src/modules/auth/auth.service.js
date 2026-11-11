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
        await repository.assignDefaultRole(result.user.id);
        await donorProvisioning.provision(result.user.id);
        const token = await verificationService.issue(input.email);
        await sendVerification({ email: input.email, token, user: result.user });
        return result;
      } catch (error) {
        await repository.deleteUser(result.user.id).catch(() => {});
        throw error;
      }
    },
    async login(input, headers) {
      const user = await repository.findUserByEmail(input.email);
      assertUserCanSignIn(user);
      return engine.api.signInEmail({
        body: { email: input.email, password: input.password },
        headers,
        returnHeaders: true
      });
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
