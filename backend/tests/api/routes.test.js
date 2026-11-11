import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { createApiRouter } from '../../src/routes/index.js';
import { createAuthenticatedRouter } from '../../src/routes/authenticated.routes.js';
import { createHealthRouter } from '../../src/routes/health.routes.js';
import { createPublicRouter } from '../../src/routes/public.routes.js';
import { createWebhookRouter } from '../../src/routes/webhook.routes.js';

function endpoint(method, path, handler) {
  const router = Router();
  router[method](path, handler);
  return router;
}

describe('route composition', () => {
  it('keeps liveness independent from readiness dependencies', async () => {
    const health = createHealthRouter({
      checks: { database: vi.fn().mockRejectedValue(new Error('offline')) },
      timeoutMs: 50
    });
    const app = createApp({ routes: { api: createApiRouter({ health }) } });

    const live = await request(app).get('/api/v1/health/live');
    const ready = await request(app).get('/api/v1/health/ready');
    expect(live.status).toBe(200);
    expect(ready.status).toBe(503);
    expect(ready.body.error).toMatchObject({
      code: 'INTEGRATION_UNAVAILABLE',
      details: { dependencies: { database: 'unavailable' } }
    });
  });

  it('mounts public routes under the explicit public boundary', async () => {
    const publicEndpoint = endpoint('get', '/summary', (_req, res) => res.json({ public: true }));
    const api = createApiRouter({
      publicRoutes: [{ path: '/transparency', router: publicEndpoint }]
    });
    const app = createApp({ routes: { api } });

    const response = await request(app).get('/api/v1/public/transparency/summary');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ public: true });
  });

  it('applies authentication and audit context only to registered protected routes', async () => {
    const protectedEndpoint = endpoint('get', '/me', (req, res) =>
      res.json({ userId: req.auth.user.id, actorId: req.audit.actorId })
    );
    const authenticationMiddleware = (req, _res, next) => {
      req.auth = {
        user: { id: 'user-1' },
        session: { id: 'session-1' },
        permissions: [],
        roles: []
      };
      next();
    };
    const api = createApiRouter({
      authenticatedRoutes: [{ path: '/account', router: protectedEndpoint }],
      authenticationMiddleware
    });
    const app = createApp({ routes: { api } });

    const response = await request(app).get('/api/v1/account/me');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'user-1', actorId: 'user-1' });
  });

  it('preserves the raw request body and does not apply user authentication to webhooks', async () => {
    const webhook = endpoint('post', '/callback', (req, res) =>
      res.json({ raw: req.rawBody.toString('utf8'), parsed: req.body })
    );
    const api = createApiRouter({ webhookRoutes: [{ path: '/mpesa', router: webhook }] });
    const app = createApp({ routes: { api } });

    const response = await request(app)
      .post('/api/v1/webhooks/mpesa/callback')
      .set('Content-Type', 'application/json')
      .send('{"transaction":"ABC123"}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      raw: '{"transaction":"ABC123"}',
      parsed: { transaction: 'ABC123' }
    });
  });

  it('returns a correlated 404 for routes that were not explicitly registered', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/not-registered');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('rejects malformed route definitions during application construction', () => {
    expect(() => createPublicRouter({ routes: [{ path: '/broken' }] })).toThrow(TypeError);
    expect(() => createAuthenticatedRouter({ routes: [{ router: Router() }] })).toThrow(TypeError);
    expect(() => createWebhookRouter({ routes: [{}] })).toThrow(TypeError);
  });
});
