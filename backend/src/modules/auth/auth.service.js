import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { authenticationConfig } from '../../config/authentication.js';
import { STATUSES } from '../../constants/statuses.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { logger } from '../../observability/logger.js';
import { donorsService } from '../donors/donors.service.js';
import { accountVerificationService } from './accountVerification.service.js';
import { AUTH_AUDIT, authAudit } from './authAudit.js';
import { authMailer } from './authMailer.js';
import {
  assertTemporaryPasswordValid,
  assertUserCanSignIn,
  portalAllowsRoles,
  requiresMfaEnrollment,
  resolvePortal
} from './auth.policy.js';
import { authRepository } from './auth.repository.js';
import { STUDENT_EMAIL_REGEX } from './auth.validation.js';
import { authEngine } from './betterAuth.js';
import { ThrottledError, throttleService } from './throttle.service.js';

function unwrap(result) {
  return result?.response ?? result;
}

const noopThrottle = Object.freeze({
  assertLoginAllowed: async () => {},
  recordLoginFailure: async () => ({ failures: 0, lockedForSeconds: 0 }),
  resetLogin: async () => {},
  registerAllowed: async () => {},
  resendAllowed: async () => {},
  resetRequestAllowed: async () => {},
  assertPasswordChangeAllowed: async () => {},
  recordPasswordChangeFailure: async () => ({ failures: 0, lockedForSeconds: 0 }),
  resetPasswordChange: async () => {}
});

const noopAudit = Object.freeze({ record: async () => {} });
const noopMailer = Object.freeze({
  sendVerification: async () => ({ delivery: 'SKIPPED' }),
  sendAlreadyRegistered: async () => ({ delivery: 'SKIPPED' }),
  sendPasswordReset: async () => ({ delivery: 'SKIPPED' })
});

let dummyHashPromise;
const getDummyHash = () => {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword('charitychain-dummy-timing-password-00');
  }
  return dummyHashPromise;
};

function permissionsFor(user) {
  return [
    ...new Set(
      user.roles?.flatMap(
        (assignment) => assignment.role?.permissions?.map((item) => item.permission.code) ?? []
      ) ?? []
    )
  ];
}

export function createAuthService({
  engine = authEngine,
  repository = authRepository,
  verificationService = accountVerificationService,
  donorProvisioning = donorsService,
  mailer,
  throttle,
  audit,
  sendVerification
} = {}) {
  const useDefaultDeps = repository === authRepository;
  const activeThrottle = throttle ?? (useDefaultDeps ? throttleService : noopThrottle);
  const activeAudit = audit ?? (useDefaultDeps ? authAudit : noopAudit);
  const activeMailer = mailer ?? (useDefaultDeps ? authMailer : noopMailer);

  async function registerAccount(input, { isStudent, registrationNumber }, context = {}) {
    if (context.ip) await activeThrottle.registerAllowed(context.ip);
    const normalizedEmail = String(input.email ?? '').trim().toLowerCase();
    if (isStudent && !STUDENT_EMAIL_REGEX.test(normalizedEmail)) {
      throw new ValidationError('Incorrect email', [
        { path: 'email', message: 'Incorrect email', code: 'custom' }
      ]);
    }
    const existing = await repository.findUserByEmail?.(normalizedEmail);
    if (existing) {
      try {
        await activeMailer.sendAlreadyRegistered?.({
          email: normalizedEmail,
          name: existing.name
        });
      } catch (error) {
        logger.error({ error }, 'Already-registered email handler failed');
      }
      return {
        alreadyRegistered: true,
        requiresVerification: true,
        email: normalizedEmail
      };
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
        try {
          await activeMailer.sendAlreadyRegistered?.({
            email: normalizedEmail,
            name: input.name
          });
        } catch (mailError) {
          logger.error({ error: mailError }, 'Already-registered email handler failed');
        }
        return {
          alreadyRegistered: true,
          requiresVerification: true,
          email: normalizedEmail
        };
      }
      throw error;
    }

    let token;
    try {
      if (isStudent) {
        await repository.assignDefaultRole(result.user.id, 'STUDENT');
        await repository.ensureStudentProfile?.(
          result.user.id,
          input.name,
          registrationNumber,
          {
            school: input.school,
            programme: input.programme,
            yearOfStudy: input.yearOfStudy
          }
        );
      } else {
        await repository.assignDefaultRole(result.user.id, 'DONOR');
        await donorProvisioning.provision(result.user.id);
      }
      token = await verificationService.issue(normalizedEmail);
    } catch (error) {
      await repository.deleteUser(result.user.id).catch(() => {});
      throw error;
    }

    // Send outside the user-creation rollback block so provider outages never delete users.
    if (typeof sendVerification === 'function') {
      try {
        await sendVerification({ email: normalizedEmail, token, user: result.user });
      } catch (error) {
        logger.error({ error }, 'Verification email handler failed');
      }
    } else {
      try {
        await activeMailer.sendVerification?.({
          email: normalizedEmail,
          token,
          user: result.user
        });
      } catch (error) {
        logger.error({ error }, 'Verification email handler failed');
      }
    }

    await activeAudit.record(AUTH_AUDIT.REGISTERED, {
      actorId: result.user.id,
      context,
      metadata: { role: isStudent ? 'STUDENT' : 'DONOR' }
    });

    return {
      ...result,
      email: normalizedEmail,
      requiresVerification: true
    };
  }

  return {
    async registerStaff(input) {
      const result = unwrap(await engine.api.signUpEmail({ body: input }));
      return result.user;
    },
    registerStudent(input, context = {}) {
      return registerAccount(
        input,
        { isStudent: true, registrationNumber: input.registrationNumber },
        context
      );
    },
    register(input, context = {}) {
      const normalizedEmail = String(input.email ?? '').trim().toLowerCase();
      const isStudent =
        input.role === 'STUDENT' || normalizedEmail.endsWith('@students.must.ac.ke');
      return registerAccount(
        { ...input, email: normalizedEmail },
        { isStudent, registrationNumber: input.registrationNumber },
        context
      );
    },
    async login(input, headers, context = {}) {
      const normalizedEmail = String(input.email ?? '').trim().toLowerCase();
      if (
        (input.role === 'STUDENT' ||
          input.portal === 'student' ||
          normalizedEmail.endsWith('@students.must.ac.ke')) &&
        !STUDENT_EMAIL_REGEX.test(normalizedEmail)
      ) {
        throw new ValidationError('Incorrect email', [
          { path: 'email', message: 'Incorrect email', code: 'custom' }
        ]);
      }

      await activeThrottle.assertLoginAllowed(normalizedEmail, context.ip);
      const user = await repository.findUserByEmail(normalizedEmail);

      const recordFailureAndThrow = async (actorId = null, reason = 'invalid_credentials') => {
        const state = await activeThrottle.recordLoginFailure(normalizedEmail, context.ip);
        if (state.lockedForSeconds > 0) {
          await activeAudit.record(AUTH_AUDIT.LOGIN_LOCKED, {
            actorId,
            outcome: 'DENIED',
            context,
            metadata: { failures: state.failures, lockedForSeconds: state.lockedForSeconds }
          });
          throw new ThrottledError(state.lockedForSeconds);
        }
        await activeAudit.record(AUTH_AUDIT.SIGNED_IN, {
          actorId,
          outcome: 'FAILURE',
          context,
          metadata: { reason }
        });
        throw new AuthenticationError('The email or password is incorrect.', {
          code: ERROR_CODES.INVALID_CREDENTIALS
        });
      };

      const portal = resolvePortal(input);

      if (typeof repository.findCredentialAccount === 'function') {
        if (!user) {
          await verifyPassword({ hash: await getDummyHash(), password: input.password }).catch(
            () => false
          );
          await recordFailureAndThrow(null, 'unknown_user');
        }
        const credential = await repository.findCredentialAccount(user.id);
        let valid = false;
        if (credential?.password) {
          valid = await verifyPassword({
            hash: credential.password,
            password: input.password
          });
        } else {
          await verifyPassword({ hash: await getDummyHash(), password: input.password }).catch(
            () => false
          );
        }
        if (!valid) {
          await recordFailureAndThrow(user.id, 'wrong_password');
        }
        assertUserCanSignIn(user);
        assertTemporaryPasswordValid(user);
        const roles = user.roles.map((assignment) => assignment.role.code);
        if (!portalAllowsRoles(portal, roles)) {
          await recordFailureAndThrow(user.id, 'portal_mismatch');
        }
      } else {
        assertUserCanSignIn(user);
        assertTemporaryPasswordValid(user);
        const roles = user.roles.map((assignment) => assignment.role.code);
        if (!portalAllowsRoles(portal, roles)) {
          await recordFailureAndThrow(user.id, 'portal_mismatch');
        }
      }

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
          await recordFailureAndThrow(user?.id ?? null, 'provider_rejected');
        }
        throw error;
      }

      await activeThrottle.resetLogin(normalizedEmail, context.ip);

      const response = result.response ?? result;
      const roles = user.roles.map((assignment) => assignment.role.code);
      if (roles.includes('STUDENT')) {
        await repository.ensureStudentProfile?.(user.id, user.name);
      }
      const permissions = permissionsFor(user);
      const primaryRole =
        roles.includes('DONOR') && roles.length === 1 ? 'DONOR' : roles[0] || 'DONOR';
      const safeResponse = { ...(response ?? {}) };
      delete safeResponse.token;
      const requiresMfa = Boolean(safeResponse.twoFactorRedirect || safeResponse.requiresMfa);
      const mustChangePassword = Boolean(user.mustChangePassword);
      const mfaEnrollmentRequired = requiresMfaEnrollment(user, roles);

      await activeAudit.record(AUTH_AUDIT.SIGNED_IN, {
        actorId: user.id,
        outcome: 'SUCCESS',
        context,
        metadata: { portal }
      });

      return {
        ...(result.response ? result : { response }),
        response: {
          ...safeResponse,
          user: safeResponse.user
            ? { ...safeResponse.user, mustChangePassword, mfaEnrollmentRequired }
            : safeResponse.user,
          requiresMfa,
          role: primaryRole,
          roles,
          permissions,
          mfaVerified: !requiresMfa && Boolean(user.twoFactorEnabled),
          mustChangePassword,
          mfaEnrollmentRequired
        }
      };
    },
    async changePassword(auth, { currentPassword, newPassword }, context = {}) {
      await activeThrottle.assertPasswordChangeAllowed(auth.user.id);
      const credential = await repository.findCredentialAccount(auth.user.id);
      const valid = credential?.password
        ? await verifyPassword({ hash: credential.password, password: currentPassword })
        : false;
      if (!valid) {
        const state = await activeThrottle.recordPasswordChangeFailure(auth.user.id);
        if (state.lockedForSeconds > 0) {
          throw new ThrottledError(state.lockedForSeconds);
        }
        throw new AuthenticationError('The current password is incorrect.', {
          code: ERROR_CODES.INVALID_CREDENTIALS
        });
      }
      if (newPassword === currentPassword) {
        throw new ValidationError(
          'Choose a new password that differs from your current password.',
          [
            {
              path: 'newPassword',
              message: 'New password must differ from current password.',
              code: 'custom'
            }
          ]
        );
      }
      const hashed = await hashPassword(newPassword);
      await repository.updateCredentialPassword(auth.user.id, hashed);
      await repository.clearPasswordChangeRequirement(auth.user.id);
      await repository.revokeSessionsExcept(auth.user.id, auth.session?.token ?? null);
      await activeThrottle.resetPasswordChange(auth.user.id);
      await activeAudit.record(AUTH_AUDIT.PASSWORD_CHANGED, {
        actorId: auth.user.id,
        context
      });
      const updated = await repository.findUserById(auth.user.id);
      const roles = updated.roles.map((assignment) => assignment.role.code);
      const permissions = permissionsFor(updated);
      return {
        user: updated,
        roles,
        permissions,
        mustChangePassword: false,
        mfaEnrollmentRequired: requiresMfaEnrollment(updated, roles)
      };
    },
    async logout(headers) {
      const result = await engine.api.signOut({ headers, returnHeaders: true });
      const rawCookie = headers?.get?.('cookie') ?? '';
      const cookiePrefix = `${authenticationConfig.session.cookieName}=`;
      const cookieEntry = rawCookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(cookiePrefix));
      const token = cookieEntry
        ? decodeURIComponent(cookieEntry.slice(cookiePrefix.length)).split('.', 1)[0]
        : null;
      if (token) {
        await repository.revokeSessionByToken?.(token).catch(() => {});
      }
      return result;
    },
    getSession(headers) {
      return engine.api.getSession({ headers });
    },
    verifyCurrentPassword(password, headers) {
      return engine.api.verifyPassword({ body: { password }, headers });
    },
    async resolveSession(token) {
      const session = await repository.findSessionByToken(token);
      if (!session) return null;
      const user = await repository.findUserById(session.userId);
      if (!user || user.status !== STATUSES.USER.ACTIVE) return null;
      const roles = user.roles.map((item) => item.role.code);
      const permissions = permissionsFor(user);
      return {
        user,
        session,
        roles,
        permissions,
        mfaVerified: Boolean(user.twoFactorEnabled),
        mustChangePassword: Boolean(user.mustChangePassword),
        mfaEnrollmentRequired: requiresMfaEnrollment(user, roles)
      };
    }
  };
}

export const authService = createAuthService();
