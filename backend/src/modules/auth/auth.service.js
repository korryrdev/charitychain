import { prisma } from '@charitychain/database';
import { env } from '../../config/environment.js';
import { STATUSES } from '../../constants/statuses.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { donorsService } from '../donors/donors.service.js';
import { accountVerificationService } from './accountVerification.service.js';
import { EmailAlreadyRegisteredError } from './auth.errors.js';
import { assertUserCanSignIn } from './auth.policy.js';
import { authRepository } from './auth.repository.js';
import { STUDENT_EMAIL_REGEX } from './auth.validation.js';
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
    async registerStaff(input) {
      const result = unwrap(await engine.api.signUpEmail({ body: input }));
      return result.user;
    },
    async registerStudent(input) {
      const result = unwrap(
        await engine.api.signUpEmail({
          body: { name: input.name, email: input.email, password: input.password }
        })
      );
      try {
        await repository.assignDefaultRole(result.user.id, 'STUDENT');
        await repository.ensureStudentProfile?.(result.user.id, input.name);
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
    async register(input) {
      const normalizedEmail = String(input.email ?? '').trim().toLowerCase();
      const isStudent =
        input.role === 'STUDENT' || normalizedEmail.endsWith('@students.must.ac.ke');
      if (isStudent && !STUDENT_EMAIL_REGEX.test(normalizedEmail)) {
        throw new ValidationError('Incorrect email', [
          { path: 'email', message: 'Incorrect email', code: 'custom' }
        ]);
      }
      if (await repository.findUserByEmail?.(normalizedEmail)) {
        throw new EmailAlreadyRegisteredError();
      }
      let result;
      try {
        result = unwrap(
          await engine.api.signUpEmail({
            body: { name: input.name, email: normalizedEmail, password: input.password }
          })
        );
      } catch (error) {
        if (
          error?.statusCode === 422 ||
          error?.status === 'UNPROCESSABLE_ENTITY' ||
          error?.body?.code === 'USER_ALREADY_EXISTS' ||
          error?.body?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
        ) {
          throw new ConflictError('An account with this email address already exists.', {
            code: ERROR_CODES.CONFLICT,
            cause: error
          });
        }
        throw error;
      }
      try {
        if (isStudent) {
          await repository.assignDefaultRole(result.user.id, 'STUDENT');
          await repository.ensureStudentProfile?.(result.user.id, input.name);
        } else {
          await repository.assignDefaultRole(result.user.id, 'DONOR');
          await donorProvisioning.provision(result.user.id);
        }
        const token = await verificationService.issue(normalizedEmail);
        await sendVerification({ email: normalizedEmail, token, user: result.user });
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
      const normalizedEmail = String(input.email ?? '').trim().toLowerCase();
      if (
        (input.role === 'STUDENT' || normalizedEmail.endsWith('@students.must.ac.ke')) &&
        !STUDENT_EMAIL_REGEX.test(normalizedEmail)
      ) {
        throw new ValidationError('Incorrect email', [
          { path: 'email', message: 'Incorrect email', code: 'custom' }
        ]);
      }
      const user = await repository.findUserByEmail(normalizedEmail);
      assertUserCanSignIn(user);
      let result;
      try {
        result = await engine.api.signInEmail({
          body: { email: normalizedEmail, password: input.password },
          headers,
          returnHeaders: true
        });
      } catch (error) {
        if (
          error?.statusCode === 401 ||
          error?.status === 'UNAUTHORIZED' ||
          error?.body?.code === 'INVALID_EMAIL_OR_PASSWORD'
        ) {
          throw new AuthenticationError('The email or password is incorrect.', {
            code: ERROR_CODES.INVALID_CREDENTIALS,
            cause: error
          });
        }
        throw error;
      }
      const response = result.response ?? result;
      const roles = user.roles.map((assignment) => assignment.role.code);
      if (roles.includes('STUDENT')) {
        await repository.ensureStudentProfile?.(user.id, user.name);
      }
      const permissions = [
        ...new Set(
          user.roles.flatMap(
            (assignment) => assignment.role.permissions?.map((item) => item.permission.code) ?? []
          )
        )
      ];
      const primaryRole =
        roles.includes('DONOR') && roles.length === 1 ? 'DONOR' : roles[0] || 'DONOR';
      return {
        ...(result.response ? result : { response }),
        response: {
          ...response,
          role: primaryRole,
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
    async demoLogin({ email = 'pharmacy@malkia.charity', role } = {}) {
      const normalizedEmail = email.toLowerCase().trim();
      let user = await repository.findUserByEmail(normalizedEmail);
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: email.split('@')[0],
            email: normalizedEmail,
            emailVerified: true,
            status: STATUSES.USER.ACTIVE
          }
        });
      }

      if (role) {
        const roleRecord = await prisma.role.findFirst({
          where: {
            OR: [{ code: role.toUpperCase() }, { code: 'CLERK' }, { code: 'ADMINISTRATOR' }]
          }
        });
        if (roleRecord) {
          const existing = await prisma.userRole.findFirst({
            where: { userId: user.id, roleId: roleRecord.id }
          });
          if (!existing) {
            await prisma.userRole.create({
              data: { userId: user.id, roleId: roleRecord.id }
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
          data: { expiresAt }
        });
      } else {
        session = await prisma.session.create({
          data: { userId: user.id, token, expiresAt }
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: role || user.roles?.[0]?.role?.code || 'PHARMACY_CUSTODIAN'
        },
        token: session.token,
        expiresAt: session.expiresAt
      };
    },
    verifyCurrentPassword(password, headers) {
      return engine.api.verifyPassword({ body: { password }, headers });
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
