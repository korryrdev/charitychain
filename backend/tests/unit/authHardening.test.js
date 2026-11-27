import express from 'express';
import request from 'supertest';
import { hashPassword } from 'better-auth/crypto';
import { describe, expect, it, vi } from 'vitest';
import { STATUSES } from '../../src/constants/statuses.js';
import { createAuthenticate } from '../../src/middleware/authenticate.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { createAccountVerificationService } from '../../src/modules/auth/accountVerification.service.js';
import { createAuthController } from '../../src/modules/auth/auth.controller.js';
import { createAuthRouter } from '../../src/modules/auth/auth.routes.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import {
  createThrottleService,
  lockSecondsForFailures,
  ThrottledError
} from '../../src/modules/auth/throttle.service.js';
import { createResendEmailService } from '../../src/modules/notifications/resendEmail.service.js';

function createMemoryThrottleRepo() {
  const rows = new Map();
  return {
    rows,
    async get(key) {
      return rows.get(key) ?? null;
    },
    async consumeWindow(key, kind, windowMs) {
      const now = Date.now();
      const existing = rows.get(key);
      if (!existing || new Date(existing.windowStartedAt).getTime() + windowMs <= now) {
        const next = { key, kind, failures: 1, windowStartedAt: new Date(now), lockedUntil: null };
        rows.set(key, next);
        return next;
      }
      existing.failures += 1;
      return existing;
    },
    async recordFailure(key, kind, decayMs) {
      const now = Date.now();
      const existing = rows.get(key);
      if (!existing || new Date(existing.updatedAt ?? 0).getTime() + decayMs <= now) {
        const next = {
          key,
          kind,
          failures: 1,
          windowStartedAt: new Date(now),
          lockedUntil: null,
          updatedAt: new Date(now)
        };
        rows.set(key, next);
        return { failures: 1 };
      }
      existing.failures += 1;
      existing.updatedAt = new Date(now);
      return { failures: existing.failures };
    },
    async setLock(key, lockedUntil) {
      const existing = rows.get(key);
      if (existing) existing.lockedUntil = lockedUntil;
    },
    async clear(key) {
      rows.delete(key);
    },
    async purgeOlderThan() {
      return 0;
    }
  };
}

function makeThrottle(nowFn = () => Date.now()) {
  const repo = createMemoryThrottleRepo();
  const service = createThrottleService({
    repository: repo,
    now: nowFn,
    random: () => 1,
    config: {
      maxLoginAttempts: 5,
      accountVerificationTtlMs: 86_400_000,
      throttle: {
        lockScheduleSeconds: [30, 60, 300, 900],
        ipLoginPerMinute: 20,
        registerPerHour: 10,
        resendCooldownSeconds: 60,
        resendPerHour: 5,
        resetPerHour: 3
      }
    }
  });
  return { repo, service };
}

describe('auth hardening unit tests', () => {
  it('computes the escalating backoff schedule 0,0,0,0 -> 30,60,300,900,900', () => {
    const schedule = [30, 60, 300, 900];
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => lockSecondsForFailures(n, 5, schedule))).toEqual([
      0, 0, 0, 0, 30, 60, 300, 900, 900
    ]);
  });

  it('checks password before revealing unverified status and locks on the 5th failure with Retry-After', async () => {
    const validHash = await hashPassword('Correct-Password-123!');
    const { service: throttle } = makeThrottle();
    const pendingStudent = {
      id: 'stu-1',
      name: 'Jane Student',
      email: 'jane123456@students.must.ac.ke',
      status: STATUSES.USER.PENDING_VERIFICATION,
      twoFactorEnabled: false,
      mustChangePassword: false,
      roles: [{ role: { code: 'STUDENT', permissions: [] } }]
    };

    const repository = {
      findUserByEmail: vi.fn(async (email) =>
        email === pendingStudent.email ? pendingStudent : null
      ),
      findCredentialAccount: vi.fn(async (id) =>
        id === pendingStudent.id ? { password: validHash } : null
      )
    };
    const authService = createAuthService({
      engine: { api: { signInEmail: vi.fn() } },
      repository,
      throttle
    });

    // Wrong password on an unverified user must NOT leak ACCOUNT_NOT_VERIFIED.
    await expect(
      authService.login(
        { email: pendingStudent.email, password: 'Wrong-Password-123!', portal: 'student' },
        new Headers(),
        { ip: '10.0.0.1' }
      )
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    // Correct password on an unverified user reveals ACCOUNT_NOT_VERIFIED.
    await expect(
      authService.login(
        { email: pendingStudent.email, password: 'Correct-Password-123!', portal: 'student' },
        new Headers(),
        { ip: '10.0.0.1' }
      )
    ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_VERIFIED' });

    // Unknown user returns identical generic INVALID_CREDENTIALS and throttles after 5 failures.
    for (let i = 0; i < 4; i += 1) {
      await expect(
        authService.login(
          { email: 'nobody@example.org', password: 'Any-Password-123!', portal: 'donor' },
          new Headers(),
          { ip: '10.0.0.2' }
        )
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    }
    await expect(
      authService.login(
        { email: 'nobody@example.org', password: 'Any-Password-123!', portal: 'donor' },
        new Headers(),
        { ip: '10.0.0.2' }
      )
    ).rejects.toBeInstanceOf(ThrottledError);

    // Express errorHandler emits Retry-After header and retryAfterSeconds detail.
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    const controller = createAuthController({ service: authService, throttle });
    app.use('/public/auth', createAuthRouter(controller));
    app.use(errorHandler);

    const throttledResponse = await request(app)
      .post('/public/auth/login')
      .set('X-Forwarded-For', '10.0.0.2')
      .send({ email: 'nobody@example.org', password: 'Any-Password-123!', portal: 'donor' });
    expect(throttledResponse.status).toBe(429);
    expect(Number(throttledResponse.headers['retry-after'])).toBeGreaterThanOrEqual(1);
    expect(throttledResponse.body.error.details.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  }, 30_000);

  it('rejects cross-portal logins with the same generic INVALID_CREDENTIALS error', async () => {
    const hash = await hashPassword('Student-Strong-123!');
    const { service: throttle } = makeThrottle();
    const student = {
      id: 'stu-2',
      name: 'Student',
      email: 'john123456@students.must.ac.ke',
      status: STATUSES.USER.ACTIVE,
      twoFactorEnabled: false,
      mustChangePassword: false,
      roles: [{ role: { code: 'STUDENT', permissions: [] } }]
    };
    const authService = createAuthService({
      engine: { api: { signInEmail: vi.fn() } },
      repository: {
        findUserByEmail: vi.fn().mockResolvedValue(student),
        findCredentialAccount: vi.fn().mockResolvedValue({ password: hash })
      },
      throttle
    });

    await expect(
      authService.login(
        { email: student.email, password: 'Student-Strong-123!', portal: 'donor' },
        new Headers(),
        { ip: '10.0.0.3' }
      )
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    await expect(
      authService.login(
        { email: student.email, password: 'Student-Strong-123!', portal: 'staff' },
        new Headers(),
        { ip: '10.0.0.4' }
      )
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('hides duplicate registration, never exposes dev tokens over HTTP, and survives email failures', async () => {
    const { service: throttle } = makeThrottle();
    const mailer = {
      sendVerification: vi.fn().mockRejectedValue(new Error('Resend down')),
      sendAlreadyRegistered: vi.fn().mockResolvedValue({ delivery: 'SENT' })
    };
    const deleteUser = vi.fn();
    let userExists = false;
    const authService = createAuthService({
      engine: {
        api: {
          signUpEmail: vi.fn().mockResolvedValue({
            user: { id: 'u-new', name: 'Amina', email: 'amina123456@students.must.ac.ke' }
          })
        }
      },
      repository: {
        findUserByEmail: vi.fn(async () =>
          userExists ? { id: 'u-new', name: 'Amina', email: 'amina123456@students.must.ac.ke' } : null
        ),
        assignDefaultRole: vi.fn().mockResolvedValue({}),
        ensureStudentProfile: vi.fn().mockResolvedValue({}),
        deleteUser
      },
      verificationService: { issue: vi.fn().mockResolvedValue('t'.repeat(43)) },
      mailer,
      throttle
    });

    // Email failure during register must NOT delete the newly created user.
    const app = express();
    app.use(express.json());
    const controller = createAuthController({ service: authService, throttle, mailer });
    app.use('/public/auth', createAuthRouter(controller));
    app.use(errorHandler);

    const first = await request(app).post('/public/auth/register-student').send({
      name: 'Amina',
      email: 'amina123456@students.must.ac.ke',
      password: 'VeryStrongPassword123!',
      registrationNumber: 'CT201/000001/24',
      school: 'School of Computing and Informatics',
      programme: 'BSc. in Data Science (BDS)',
      yearOfStudy: 2
    });
    expect(first.status).toBe(201);
    expect(first.body).toEqual({
      requiresVerification: true,
      email: 'amina123456@students.must.ac.ke'
    });
    expect(first.body.developmentVerificationToken).toBeUndefined();
    expect(first.body.user).toBeUndefined();
    expect(deleteUser).not.toHaveBeenCalled();

    // Duplicate registration returns the same 201 shape and sends already-registered email.
    userExists = true;
    const second = await request(app).post('/public/auth/register-student').send({
      name: 'Amina',
      email: 'amina123456@students.must.ac.ke',
      password: 'VeryStrongPassword123!',
      registrationNumber: 'CT201/000001/24',
      school: 'School of Computing and Informatics',
      programme: 'BSc. in Data Science (BDS)',
      yearOfStudy: 2
    });
    expect(second.status).toBe(201);
    expect(second.body).toEqual({
      requiresVerification: true,
      email: 'amina123456@students.must.ac.ke'
    });
    expect(mailer.sendAlreadyRegistered).toHaveBeenCalledOnce();
  });

  it('issues single-use tokens, invalidates prior tokens on resend, and rate-limits resends', async () => {
    const store = [];
    const user = {
      id: 'u-ver',
      name: 'Ver User',
      email: 'ver@example.org',
      status: STATUSES.USER.PENDING_VERIFICATION
    };
    const repository = {
      deleteVerifications: vi.fn(async (identifier) => {
        for (let i = store.length - 1; i >= 0; i -= 1) {
          if (store[i].identifier === identifier) store.splice(i, 1);
        }
      }),
      createVerification: vi.fn(async (data) => store.push({ id: `v-${store.length}`, ...data })),
      consumeVerification: vi.fn(async (identifier, value) => {
        const idx = store.findIndex(
          (item) => item.identifier === identifier && item.value === value && item.expiresAt > new Date()
        );
        if (idx === -1) return null;
        return store.splice(idx, 1)[0];
      }),
      findUserByEmail: vi.fn(async (email) => (email === user.email ? user : null)),
      activateUser: vi.fn(async () => ({ ...user, status: STATUSES.USER.ACTIVE, emailVerified: true }))
    };
    const { service: throttle } = makeThrottle();
    const mailer = { sendVerification: vi.fn().mockResolvedValue({ delivery: 'SENT' }) };
    const verification = createAccountVerificationService({ repository, throttle, mailer });

    const firstToken = await verification.issue(user.email);
    await verification.resend(user.email);
    expect(mailer.sendVerification).toHaveBeenCalledOnce();

    // Old token was invalidated by resend.
    await expect(verification.verify(user.email, firstToken)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED'
    });

    // Second immediate resend is throttled by the 60s cooldown.
    await expect(verification.resend(user.email)).rejects.toBeInstanceOf(ThrottledError);

    // Unknown email still returns accepted=false without leaking and obeys same cooldown.
    await expect(verification.resend('missing@example.org')).resolves.toEqual({ sent: false });
    await expect(verification.resend('missing@example.org')).rejects.toBeInstanceOf(ThrottledError);
  });

  it('enforces staff temporary password expiry, forced password change, and mandatory MFA enrollment', async () => {
    const tempHash = await hashPassword('Temp-Pass-123456!');
    const expiredStaff = {
      id: 'staff-exp',
      email: 'exp@example.org',
      status: STATUSES.USER.ACTIVE,
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() - 60_000),
      twoFactorEnabled: false,
      roles: [{ role: { code: 'CLERK', permissions: [] } }]
    };
    const { service: throttle } = makeThrottle();
    const service = createAuthService({
      engine: { api: { signInEmail: vi.fn() } },
      repository: {
        findUserByEmail: vi.fn().mockResolvedValue(expiredStaff),
        findCredentialAccount: vi.fn().mockResolvedValue({ password: tempHash })
      },
      throttle
    });

    await expect(
      service.login(
        { email: expiredStaff.email, password: 'Temp-Pass-123456!', portal: 'staff' },
        new Headers()
      )
    ).rejects.toMatchObject({ code: 'TEMP_PASSWORD_EXPIRED' });

    // Middleware blocks routes when mustChangePassword or mfaEnrollmentRequired is true, except /users/me and /users/me/password.
    const makeApp = (authState) => {
      const app = express();
      app.use(express.json());
      app.use(createAuthenticate({ resolveSession: vi.fn().mockResolvedValue(authState) }));
      app.get('/api/v1/users/me', (_req, res) => res.json({ ok: true }));
      app.post('/api/v1/users/me/password', (_req, res) => res.json({ ok: true }));
      app.get('/api/v1/cases', (_req, res) => res.json({ ok: true }));
      app.use(errorHandler);
      return app;
    };

    const pwGateApp = makeApp({
      user: { id: 's1', status: STATUSES.USER.ACTIVE, mustChangePassword: true },
      session: { id: 'ses1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null },
      roles: ['ADMINISTRATOR'],
      permissions: [],
      mustChangePassword: true,
      mfaEnrollmentRequired: true
    });

    expect(
      (await request(pwGateApp).get('/api/v1/users/me').set('Authorization', `Bearer ${'t'.repeat(32)}`)).status
    ).toBe(200);
    expect(
      (await request(pwGateApp).post('/api/v1/users/me/password').set('Authorization', `Bearer ${'t'.repeat(32)}`)).status
    ).toBe(200);
    const blockedPw = await request(pwGateApp)
      .get('/api/v1/cases')
      .set('Authorization', `Bearer ${'t'.repeat(32)}`);
    expect(blockedPw.status).toBe(403);
    expect(blockedPw.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');

    const mfaGateApp = makeApp({
      user: { id: 's1', status: STATUSES.USER.ACTIVE, mustChangePassword: false },
      session: { id: 'ses1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null },
      roles: ['COMMITTEE_MEMBER'],
      permissions: [],
      mustChangePassword: false,
      mfaEnrollmentRequired: true
    });
    const blockedMfa = await request(mfaGateApp)
      .get('/api/v1/cases')
      .set('Authorization', `Bearer ${'t'.repeat(32)}`);
    expect(blockedMfa.status).toBe(403);
    expect(blockedMfa.body.error.code).toBe('MFA_ENROLLMENT_REQUIRED');

    // changePassword invalidates temp password, clears flag, and revokes other sessions.
    const updateCredentialPassword = vi.fn().mockResolvedValue({});
    const clearPasswordChangeRequirement = vi.fn().mockResolvedValue({});
    const revokeSessionsExcept = vi.fn().mockResolvedValue({});
    const changeService = createAuthService({
      repository: {
        findCredentialAccount: vi.fn().mockResolvedValue({ password: tempHash }),
        updateCredentialPassword,
        clearPasswordChangeRequirement,
        revokeSessionsExcept,
        findUserById: vi.fn().mockResolvedValue({
          id: 's1',
          email: 'admin@example.org',
          mustChangePassword: false,
          twoFactorEnabled: false,
          roles: [{ role: { code: 'ADMINISTRATOR', permissions: [] } }]
        })
      },
      throttle
    });
    const changed = await changeService.changePassword(
      { user: { id: 's1' }, session: { token: 'current-tok' } },
      { currentPassword: 'Temp-Pass-123456!', newPassword: 'Brand-New-Strong-Password-99!' }
    );
    expect(updateCredentialPassword).toHaveBeenCalledOnce();
    expect(clearPasswordChangeRequirement).toHaveBeenCalledWith('s1');
    expect(revokeSessionsExcept).toHaveBeenCalledWith('s1', 'current-tok');
    expect(changed.mustChangePassword).toBe(false);
    expect(changed.mfaEnrollmentRequired).toBe(true);
  });

  it('sends Resend emails with Idempotency-Key and retries once on 5xx responses', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('upstream error', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 }));

    const emailService = createResendEmailService({
      environment: {
        NODE_ENV: 'production',
        FEATURE_EMAIL_ENABLED: true,
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'access@charitychain.lumensieve.com',
        APP_NAME: 'CharityChain'
      },
      fetchImpl,
      wait: async () => {}
    });

    const result = await emailService.sendAccountVerification({
      recipientName: 'Student',
      email: 'student123456@students.must.ac.ke',
      verifyUrl: 'http://localhost:5173/student/auth/verify?token=abc',
      expiresInHours: 24,
      idempotencyKey: 'verify-abc'
    });

    expect(result).toEqual({ delivery: 'SENT', providerMessageId: 'msg_123' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][1].headers['Idempotency-Key']).toBe('verify-abc');
  });
});
