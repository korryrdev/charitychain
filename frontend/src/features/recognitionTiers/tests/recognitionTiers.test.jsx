import { describe, expect, it, vi } from 'vitest';
import { createRecognitionApi } from '../services/recognition.api.js';
describe('recognition API', () => { it('keeps public tiers and authenticated donor progress separate', async () => { const client = { get: vi.fn().mockResolvedValue({}) }; const api = createRecognitionApi(client); await api.tiers(); await api.mine(); expect(client.get).toHaveBeenNthCalledWith(1, '/public/recognition/tiers'); expect(client.get).toHaveBeenNthCalledWith(2, '/recognition/me'); }); });
