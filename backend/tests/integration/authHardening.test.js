import { prisma } from '@charitychain/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { STATUSES } from '../../src/constants/statuses.js';
import { accountVerificationService } from '../../src/modules/auth/accountVerification.service.js';
import { createAuthController } from '../../src/modules/auth/auth.controller.js';
import { createAuthRouter } from '../../src/modules/auth/auth.routes.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import { throttleService } from '../../src/modules/auth/throttle.service.js';
import { createApiRouter } from '../../src/routes/index.js';
import { usersService } from '../../src/modules/users/users.service.js';

const run = Date.now();
const studentEmail = `hardening${String(run).slice(-6)}@students.must.ac.ke`;
const studentReg = `CT206/${String(run).slice(-6)}/24`;
const studentPass = 'Hardening-Student-Password-99!';
const staffEmail = `staff-hardening-${run}@example.test`;
const issuedTokens = [];

beforeAll(async () => {
  await prisma.role.upsert({
    where: { code: 'STUDENT' },
    update: {},
    create: { code: 'STUDENT', name: 'Student' }
  });
  await prisma.role.upsert({
    where: { code: 'ADMINISTRATOR' },
    update: {},
    create: { code: 'ADMINISTRATOR', name: 'Administrator' }
  });
});

afterAll(async () => {
  // Clean up throttle rows created by this test run; audit rows remain append-only.
  await prisma.authThrottle.deleteMany({
    where: {
      key: {
        in: [
          throttleService.loginKey(studentEmail, '::ffff:127.0.0.1'),
          throttleService.loginKey(studentEmail, '127.0.0.1')
        ]
      }
    }
  });
});

describe('Auth hardening Postgres & HTTP integration', () => {
  it('registers student, blocks login until verified, throttles after 5 failures with Retry-After, verifies once, and signs in', async () => {
    const authService = createAuthService({
      sendVerification: ({ token }) => {
        issuedTokens.push(token);
      }
    });
    const controller = createAuthController({ service: authService });
    const app = createApp({
      routes: {
        api: createApiRouter({
          publicRoutes: [{ path: '/auth', router: createAuthRouter(controller) }]
        })
      }
    });

    const reg = await request(app).post('/api/v1/public/auth/register-student').send({
      name: 'Hardening Student',
      email: studentEmail,
      password: studentPass,
      registrationNumber: studentReg,
      school: 'School of Pure and Applied Sciences',
      programme: 'BSc. in Applied Mathematics',
      yearOfStudy: 3
    });
    expect(reg.status).toBe(201);
    expect(reg.body).toEqual({ requiresVerification: true, email: studentEmail });
    expect(reg.body.developmentVerificationToken).toBeUndefined();
    expect(issuedTokens).toHaveLength(1);

    const createdStudent = await prisma.student.findUniqueOrThrow({
      where: { registrationNumber: studentReg }
    });
    expect(createdStudent.school).toBe('School of Pure and Applied Sciences');
    expect(createdStudent.programme).toBe('BSc. in Applied Mathematics');
    expect(createdStudent.yearOfStudy).toBe(3);

    // 4 wrong passwords -> 401 INVALID_CREDENTIALS, 5th -> 429 with Retry-After
    for (let i = 0; i < 4; i += 1) {
      const bad = await request(app).post('/api/v1/public/auth/login').send({
        email: studentEmail,
        password: 'Wrong-Password-123!',
        portal: 'student'
      });
      expect(bad.status).toBe(401);
      expect(bad.body.error.code).toBe('INVALID_CREDENTIALS');
    }
    const locked = await request(app).post('/api/v1/public/auth/login').send({
      email: studentEmail,
      password: 'Wrong-Password-123!',
      portal: 'student'
    });
    expect(locked.status).toBe(429);
    expect(Number(locked.headers['retry-after'])).toBeGreaterThanOrEqual(1);
    expect(locked.body.error.details.retryAfterSeconds).toBeGreaterThanOrEqual(1);

    // Reset login throttle via DB for the valid-login check, still unverified -> ACCOUNT_NOT_VERIFIED
    await prisma.authThrottle.deleteMany({});
    const unverified = await request(app).post('/api/v1/public/auth/login').send({
      email: studentEmail,
      password: studentPass,
      portal: 'student'
    });
    expect(unverified.status).toBe(401);
    expect(unverified.body.error.code).toBe('ACCOUNT_NOT_VERIFIED');

    // Verify once via HTTP
    const verify = await request(app).post('/api/v1/public/auth/verify-account').send({
      email: studentEmail,
      token: issuedTokens[0]
    });
    expect(verify.status).toBe(204);

    // Reusing token fails
    const reuse = await request(app).post('/api/v1/public/auth/verify-account').send({
      email: studentEmail,
      token: issuedTokens[0]
    });
    expect(reuse.status).toBe(401);

    // Cross-portal attempt (student on donor portal) returns generic INVALID_CREDENTIALS
    const wrongPortal = await request(app).post('/api/v1/public/auth/login').send({
      email: studentEmail,
      password: studentPass,
      portal: 'donor'
    });
    expect(wrongPortal.status).toBe(401);
    expect(wrongPortal.body.error.code).toBe('INVALID_CREDENTIALS');

    await prisma.authThrottle.deleteMany({});

    // Correct portal succeeds
    const ok = await request(app).post('/api/v1/public/auth/login').send({
      email: studentEmail,
      password: studentPass,
      portal: 'student'
    });
    expect(ok.status).toBe(200);
    expect(ok.body.roles).toContain('STUDENT');
    expect(ok.body.mustChangePassword).toBe(false);
    expect(ok.body.mfaEnrollmentRequired).toBe(false);
  }, 30_000);

  it('provisions invited staff with temporary password, blocks workspace until changed, and invalidates temp password', async () => {
    const invite = await usersService.createStaffAccount({
      name: 'Hardening Admin',
      email: staffEmail,
      roles: ['ADMINISTRATOR'],
      roleName: 'Administrator'
    });
    expect(invite.user.mustChangePassword).toBe(true);
    expect(invite.user.mfaEnrollmentRequired).toBe(true);
    expect(invite.activationUrl).toMatch(/\/staff\/login$/);

    const app = createApp();
    const loginRes = await request(app).post('/api/v1/public/auth/login').send({
      email: staffEmail,
      password: invite.temporaryPassword,
      portal: 'staff'
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.mustChangePassword).toBe(true);
    expect(loginRes.body.mfaEnrollmentRequired).toBe(true);

    const cookies = loginRes.headers['set-cookie'];
    const csrfCookie = cookies.find((c) => c.startsWith('charitychain_csrf='))?.split(';')[0].split('=')[1];

    // Other endpoints are blocked until temporary password is changed
    const blocked = await request(app).get('/api/v1/cases').set('Cookie', cookies);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');

    // /users/me is allowed
    const me = await request(app).get('/api/v1/users/me').set('Cookie', cookies);
    expect(me.status).toBe(200);
    expect(me.body.user.mustChangePassword).toBe(true);

    // Change password
    const newPassword = 'Staff-Chosen-Password-42!';
    const changed = await request(app)
      .post('/api/v1/users/me/password')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfCookie)
      .send({ currentPassword: invite.temporaryPassword, newPassword });
    expect(changed.status).toBe(200);
    expect(changed.body.mustChangePassword).toBe(false);
    expect(changed.body.mfaEnrollmentRequired).toBe(true);

    // Still blocked by mandatory MFA enrollment
    const mfaBlocked = await request(app).get('/api/v1/cases').set('Cookie', cookies);
    expect(mfaBlocked.status).toBe(403);
    expect(mfaBlocked.body.error.code).toBe('MFA_ENROLLMENT_REQUIRED');

    // Old temporary password no longer works
    const oldPass = await request(app).post('/api/v1/public/auth/login').send({
      email: staffEmail,
      password: invite.temporaryPassword,
      portal: 'staff'
    });
    expect(oldPass.status).toBe(401);
    expect(oldPass.body.error.code).toBe('INVALID_CREDENTIALS');

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { email: staffEmail } });
    expect(dbUser.status).toBe(STATUSES.USER.ACTIVE);
    expect(dbUser.mustChangePassword).toBe(false);
    await accountVerificationService.issue(staffEmail).catch(() => {});
  }, 30_000);
});
