import { httpClient, type HttpClient } from '../../../services/httpClient';

export function createMoneyDonationsApi(client: Pick<HttpClient, 'request' | 'get'> = httpClient) {
  return Object.freeze({
    create: (input: Record<string, unknown>) =>
      client.request('/donations', {
        method: 'POST',
        body: input,
        headers: { 'idempotency-key': crypto.randomUUID() },
      }),
    listMine: (query: string = '') => client.get(`/donations${query}`),
    get: (id: string) => client.get(`/donations/${id}`),
    receipt: (id: string) => client.get(`/donations/${id}/receipt`),
    verifyReceipt: (id: string) => client.get(`/donations/${id}/receipt/verify`),
  });
}

export const moneyDonationsApi = createMoneyDonationsApi();
