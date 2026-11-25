import { describe, expect, it, vi } from 'vitest';
import { createTransparencyApi } from '../services/transparency.api.js';
describe('public transparency API', () => { it('uses the public, sanitised dashboard endpoint', async () => { const client = { get: vi.fn().mockResolvedValue({ dashboard: {} }) }; const api = createTransparencyApi(client); await api.dashboard(); expect(client.get).toHaveBeenCalledWith('/public/transparency/dashboard'); }); });
