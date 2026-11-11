import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { STATUSES } from '../../src/constants/statuses.js';
import { auditContext } from '../../src/middleware/auditContext.js';
import { createAuthenticate } from '../../src/middleware/authenticate.js';
import { authorize } from '../../src/middleware/authorize.js';
import { createCsrfProtection } from '../../src/middleware/csrfProtection.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { createIdempotency } from '../../src/middleware/idempotency.js';
import { createRateLimit } from '../../src/middleware/rateLimit.js';
import { requestContext } from '../../src/middleware/requestContext.js';
import { requireMfa } from '../../src/middleware/requireMfa.js';
import { validateRequest } from '../../src/middleware/validateRequest.js';

function application() {
  const app = express();
  app.use(requestContext, express.json(), cookieParser());
  return app;
}

function activeAuthentication(overrides = {}) {
  return {
    user: { id: 'user-1', status: STATUSES.USER.ACTIVE },
    session: { id: 'session-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null },
    roles: [],
    permissions: [],
    mfaVerified: false,
    ...overrides
  };
}

describe('authentication and access middleware', () => {
  it('authenticates an active session and attaches immutable access context', async () => {
    const app = application();
    const resolveSession = vi.fn().mockResolvedValue(activeAuthentication());
    app.get('/private', createAuthenticate({ resolveSession }), (req, res) => {
      res.json({ userId: req.auth.user.id, frozen: Object.isFrozen(req.auth) });
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/private')
      .set('Authorization', `Bearer ${'t'.repeat(32)}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'user-1', frozen: true });
    expect(resolveSession).toHaveBeenCalledOnce();
  });

  it('rejects missing, expired, and inactive sessions', async () => {
    const scenarios = [
      { authentication: null, code: 'AUTHENTICATION_REQUIRED', withToken: false },
      {
        authentication: activeAuthentication({
          session: { id: 'session-1', expiresAt: new Date(Date.now() - 1), revokedAt: null }
        }),
        code: 'SESSION_EXPIRED',
        withToken: true
      },
      {
        authentication: activeAuthentication({
          session: { id: 'session-1', expiresAt: 'not-a-date', revokedAt: null }
        }),
        code: 'SESSION_EXPIRED',
        withToken: true
      },
      {
        authentication: activeAuthentication({
          user: { id: 'user-1', status: STATUSES.USER.LOCKED }
        }),
        code: 'ACCOUNT_LOCKED',
        withToken: true
      }
    ];

    for (const scenario of scenarios) {
      const app = application();
      app.get(
        '/private',
        createAuthenticate({ resolveSession: vi.fn().mockResolvedValue(scenario.authentication) }),
        (_req, res) => res.sendStatus(204)
      );
      app.use(errorHandler);
      const call = request(app).get('/private');
      if (scenario.withToken) call.set('Authorization', `Bearer ${'t'.repeat(32)}`);
      const response = await call;
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe(scenario.code);
    }
  });

  it('enforces permissions and MFA independently', async () => {
    const app = application();
    app.use((req, _res, next) => {
      req.auth = activeAuthentication({ permissions: [PERMISSIONS.APPLICATION_APPROVE] });
      next();
    });
    app.get('/approve', authorize(PERMISSIONS.APPLICATION_APPROVE), (_req, res) =>
      res.sendStatus(204)
    );
    app.get('/admin', authorize(PERMISSIONS.SYSTEM_ADMINISTER), (_req, res) => res.sendStatus(204));
    app.get('/mfa', requireMfa, (_req, res) => res.sendStatus(204));
    app.use(errorHandler);

    expect((await request(app).get('/approve')).status).toBe(204);
    expect((await request(app).get('/admin')).status).toBe(403);
    const mfaResponse = await request(app).get('/mfa');
    expect(mfaResponse.status).toBe(401);
    expect(mfaResponse.body.error.code).toBe('MFA_REQUIRED');
  });
});

describe('request protection middleware', () => {
  it('rejects invalid CSRF tokens for cookie sessions and accepts matching tokens', async () => {
    const app = application();
    const csrf = createCsrfProtection();
    app.post('/change', csrf, (_req, res) => res.sendStatus(204));
    app.use(errorHandler);
    const token = 'c'.repeat(32);

    expect(
      (
        await request(app)
          .post('/change')
          .set('Cookie', `charitychain_session=${'s'.repeat(32)}`)
      ).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .post('/change')
          .set('Cookie', [`charitychain_session=${'s'.repeat(32)}`, `charitychain_csrf=${token}`])
          .set('X-CSRF-Token', token)
      ).status
    ).toBe(204);
  });

  it('limits repeated requests and emits retry metadata', async () => {
    const app = application();
    app.use(createRateLimit({ maximumRequests: 2, windowMs: 60_000 }));
    app.get('/limited', (_req, res) => res.sendStatus(204));
    app.use(errorHandler);

    expect((await request(app).get('/limited')).status).toBe(204);
    expect((await request(app).get('/limited')).status).toBe(204);
    const blocked = await request(app).get('/limited');
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeTruthy();
    expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('validates and replaces request data with parsed values', async () => {
    const app = application();
    app.post(
      '/validate/:id',
      validateRequest({
        params: z.object({ id: z.uuid() }),
        body: z.object({ amount: z.coerce.number().positive() })
      }),
      (req, res) => res.json({ id: req.params.id, amount: req.body.amount })
    );
    app.use(errorHandler);

    const valid = await request(app)
      .post('/validate/123e4567-e89b-12d3-a456-426614174000')
      .send({ amount: '250' });
    expect(valid.status).toBe(200);
    expect(valid.body.amount).toBe(250);
    const invalid = await request(app).post('/validate/not-a-uuid').send({ amount: -1 });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details).toBeInstanceOf(Array);
  });

  it('replays matching idempotent requests and rejects key reuse with a different body', async () => {
    const app = application();
    let executions = 0;
    app.post('/payments', createIdempotency(), (req, res) => {
      executions += 1;
      res.status(201).json({ amount: req.body.amount, executions });
    });
    app.use(errorHandler);
    const key = 'payment-request-0001';

    const first = await request(app)
      .post('/payments')
      .set('Idempotency-Key', key)
      .send({ amount: 100 });
    const replay = await request(app)
      .post('/payments')
      .set('Idempotency-Key', key)
      .send({ amount: 100 });
    const conflict = await request(app)
      .post('/payments')
      .set('Idempotency-Key', key)
      .send({ amount: 200 });

    expect(first.status).toBe(201);
    expect(replay.status).toBe(201);
    expect(replay.headers['idempotency-replayed']).toBe('true');
    expect(executions).toBe(1);
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('creates correlated audit data without accepting an unsafe request identifier', async () => {
    const app = application();
    app.use((req, _res, next) => {
      req.auth = activeAuthentication();
      next();
    });
    app.get('/audit', auditContext, (req, res) => {
      res.json(req.audit.event('READ', 'APPLICATION', 'application-1'));
    });

    const response = await request(app).get('/audit').set('X-Request-Id', '<script>bad</script>');
    expect(response.status).toBe(200);
    expect(response.body.requestId).not.toContain('<script>');
    expect(response.body).toMatchObject({
      actorId: 'user-1',
      sessionId: 'session-1',
      action: 'READ',
      entityType: 'APPLICATION'
    });
  });
});
