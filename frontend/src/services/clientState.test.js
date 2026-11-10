import { describe, expect, it, vi } from 'vitest';
import { createHttpClient } from './httpClient.js';
import { ApiError } from './errorMapper.js';
import { createAuthStore } from '../store/auth.store.js';
import { createNotificationStore } from '../store/notification.store.js';

describe('HTTP and client state', () => {
  it('sends credentialed correlated API requests and parses JSON', async () => { const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })); const client = createHttpClient({ baseUrl: '/api/v1', fetchImpl }); await expect(client.post('/donations', { amount: 100 })).resolves.toEqual({ ok: true }); expect(fetchImpl).toHaveBeenCalledWith('/api/v1/donations', expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'x-request-id': expect.any(String), 'content-type': 'application/json' }) })); });
  it('normalizes failed responses without leaking raw transport details', async () => { const client = createHttpClient({ fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Access denied.' } }), { status: 403 })) }); await expect(client.get('/restricted')).rejects.toMatchObject({ name: 'ApiError', status: 403, code: 'FORBIDDEN' }); });
  it('publishes session and notification state changes', () => { const auth = createAuthStore(); const notifications = createNotificationStore(); const listener = vi.fn(); auth.subscribe(listener); auth.setSession({ user: { id: 'u1' } }); expect(listener).toHaveBeenCalledWith({ session: { user: { id: 'u1' } }, ready: true }); notifications.set([{ id: 'n1', read: false }]); notifications.markRead('n1'); expect(notifications.get()[0].read).toBe(true); });
});
