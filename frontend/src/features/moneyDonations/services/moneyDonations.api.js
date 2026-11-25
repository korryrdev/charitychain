import { httpClient } from '../../../services/httpClient.js';
export function createMoneyDonationsApi(client = httpClient) { return Object.freeze({ create: (input) => client.request('/donations', { method: 'POST', body: input, headers: { 'idempotency-key': crypto.randomUUID() } }), listMine: (query = '') => client.get(`/donations${query}`), get: (id) => client.get(`/donations/${id}`), receipt: (id) => client.get(`/donations/${id}/receipt`), verifyReceipt: (id) => client.get(`/donations/${id}/receipt/verify`) }); }
export const moneyDonationsApi = createMoneyDonationsApi();
