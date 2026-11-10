import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('API foundation', () => {
  const app = createApp();

  it('returns liveness', async () => {
    const response = await request(app).get('/api/v1/health/live');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'charitychain-api' });
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('returns a safe 404 contract', async () => {
    const response = await request(app).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
