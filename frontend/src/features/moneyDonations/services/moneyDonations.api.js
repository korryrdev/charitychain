import { httpClient } from '../../../services/httpClient.js';
export function createMoneyDonationsApi(client = httpClient) { return Object.freeze({ create: (input) => client.request('/donations', { method: 'POST', body: input, headers: { 'idempotency-key': crypto.randomUUID() } }), listMine: (query = '') => client.get(`/donations${query}`), get: (id) => client.get(`/donations/${id}`) }); }
export const moneyDonationsApi = createMoneyDonationsApi();
