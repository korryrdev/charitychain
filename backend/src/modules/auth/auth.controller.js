import { randomBytes } from 'node:crypto';
import { authenticationConfig } from '../../config/authentication.js';
import { accountVerificationService } from './accountVerification.service.js';
import { AUTH_AUDIT, authAudit } from './authAudit.js';
import { authMailer } from './authMailer.js';
import { authRepository } from './auth.repository.js';
import { authService } from './auth.service.js';
import { mfaService } from './mfa.service.js';
import { passwordResetService } from './passwordReset.service.js';
import { throttleService } from './throttle.service.js';

function requestHeaders(request) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(name, item);
    else if (value !== undefined) headers.set(name, value);
  }
  return headers;
}

function requestContext(request) {
  return {
    ip: request.ip,
    requestId: request.id,
    requestMethod: request.method,
    requestPath: request.originalUrl?.split('?')[0] ?? null,
    userAgent: request.get?.('user-agent') ?? null
  };
}

function applyHeaders(response, headers) {
  if (!headers) return;
  const cookies = headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) response.append('set-cookie', cookie);
  headers.forEach((value, name) => {
    if (name.toLowerCase() !== 'set-cookie') response.set(name, value);
  });
}

function issueCsrfCookie(response) {
  response.cookie('charitychain_csrf', randomBytes(32).toString('base64url'), {
    httpOnly: false,
    secure: authenticationConfig.session.cookie.secure,
    sameSite: authenticationConfig.session.cookie.sameSite,
    path: '/'
  });
}

export function createAuthController({
  service = authService,
  verificationService = accountVerificationService,
  resetService = passwordResetService,
  secondFactorService = mfaService,
  repository = authRepository,
  mailer = authMailer,
  throttle = throttleService,
  audit = authAudit,
  sendPasswordReset
} = {}) {
  return {
    register: async (request, response, next) => {
      try {
        const result = await service.register(request.body, requestContext(request));
        response.status(201).json({
          requiresVerification: true,
          email: result.email
        });
      } catch (error) {
        next(error);
      }
    },
    registerStudent: async (request, response, next) => {
      try {
        const result = await service.registerStudent(request.body, requestContext(request));
        response.status(201).json({
          requiresVerification: true,
          email: result.email
        });
      } catch (error) {
        next(error);
      }
    },
    verifyAccount: async (request, response, next) => {
      try {
        const verifiedUser = await verificationService.verify(
          request.body.email,
          request.body.token
        );
        await audit.record(AUTH_AUDIT.VERIFIED, {
          actorId: verifiedUser?.id ?? null,
          context: requestContext(request)
        });
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },
    resendVerification: async (request, response, next) => {
      try {
        const outcome = await verificationService.resend(request.body.email);
        if (outcome?.sent) {
          await audit.record(AUTH_AUDIT.VERIFICATION_RESENT, {
            actorId: outcome.userId ?? null,
            context: requestContext(request)
          });
        }
        response.status(202).json({ accepted: true });
      } catch (error) {
        next(error);
      }
    },
    login: async (request, response, next) => {
      try {
        const result = await service.login(
          request.body,
          requestHeaders(request),
          requestContext(request)
        );
        applyHeaders(response, result.headers);
        issueCsrfCookie(response);
        response.status(200).json(result.response);
      } catch (error) {
        next(error);
      }
    },
    logout: async (request, response, next) => {
      try {
        const result = await service.logout(requestHeaders(request));
        applyHeaders(response, result?.headers);
        response.clearCookie(authenticationConfig.session.cookieName, { path: '/' });
        response.clearCookie('charitychain_csrf', { path: '/' });
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },
    requestPasswordReset: async (request, response, next) => {
      try {
        await throttle.resetRequestAllowed(request.body.email);
        const reset = await resetService.issue(request.body.email);
        if (reset) {
          if (typeof sendPasswordReset === 'function') {
            await sendPasswordReset({ email: request.body.email, ...reset });
          } else {
            await mailer.sendPasswordReset({ email: request.body.email, ...reset });
          }
          await audit.record(AUTH_AUDIT.PASSWORD_RESET_REQUESTED, {
            actorId: reset.userId ?? null,
            context: requestContext(request)
          });
        }
        response.status(202).json({ accepted: true });
      } catch (error) {
        next(error);
      }
    },
    resetPassword: async (request, response, next) => {
      try {
        await resetService.reset(request.body.userId, request.body.token, request.body.password);
        await audit.record(AUTH_AUDIT.PASSWORD_RESET_COMPLETED, {
          actorId: request.body.userId,
          context: requestContext(request)
        });
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },
    enableMfa: async (request, response, next) => {
      try {
        response.json(
          await secondFactorService.enable(request.body.password, requestHeaders(request))
        );
      } catch (error) {
        next(error);
      }
    },
    verifyMfa: async (request, response, next) => {
      try {
        const result = await secondFactorService.verify(
          request.body.code,
          request.body.trustDevice,
          requestHeaders(request)
        );
        applyHeaders(response, result?.headers);
        issueCsrfCookie(response);
        const body = result?.response ?? result ?? {};
        const safeBody = { ...body };
        delete safeBody.token;
        const userId = safeBody?.user?.id;
        const fullUser = userId ? await repository.findUserById?.(userId).catch(() => null) : null;
        const roles = fullUser?.roles?.map((assignment) => assignment.role.code) ?? [];
        const permissions = [
          ...new Set(
            fullUser?.roles?.flatMap(
              (assignment) => assignment.role.permissions?.map((item) => item.permission.code) ?? []
            ) ?? []
          )
        ];
        const mustChangePassword = Boolean(fullUser?.mustChangePassword);
        response.json({
          ...safeBody,
          user: safeBody.user
            ? { ...safeBody.user, mustChangePassword, mfaEnrollmentRequired: false }
            : safeBody.user,
          roles,
          permissions,
          mfaVerified: true,
          mustChangePassword,
          mfaEnrollmentRequired: false
        });
      } catch (error) {
        next(error);
      }
    }
  };
}

export const authController = createAuthController();
