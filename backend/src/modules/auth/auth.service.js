import { STATUSES } from '../../constants/statuses.js';
import { donorsService } from '../donors/donors.service.js';
import { assertUserCanSignIn } from './auth.policy.js';
import { accountVerificationService } from './accountVerification.service.js';
import { authRepository } from './auth.repository.js';
import { authEngine } from './betterAuth.js';
import { env } from '../../config/environment.js';

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
        return {
          ...result,
          ...(env.NODE_ENV === 'production' ? {} : { developmentVerificationToken: token })
        };
      } catch (error) {
        await repository.deleteUser(result.user.id).catch(() => {});
        throw error;
      }
    },
    async login(input, headers) {
      const user = await repository.findUserByEmail(input.email);
      assertUserCanSignIn(user);
      const result = await engine.api.signInEmail({
        body: { email: input.email, password: input.password },
        headers,
        returnHeaders: true
      });
      const response = result.response ?? result;
      const roles = user.roles.map((assignment) => assignment.role.code);
      const permissions = [
        ...new Set(
          user.roles.flatMap(
            (assignment) => assignment.role.permissions?.map((item) => item.permission.code) ?? []
          )
        )
      ];
      return {
        ...(result.response ? result : { response }),
        response: {
          ...response,
          roles,
          permissions,
          mfaVerified: Boolean(user.twoFactorEnabled)
        }
      };
    },
    logout(headers) {
      return engine.api.signOut({ headers, returnHeaders: true });
    },
    getSession(headers) {
      return engine.api.getSession({ headers });
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
