import { httpClient } from '../../../services/httpClient.js';

export function createPaymentsApi(client = httpClient) {
  return Object.freeze({
    initiate: (input) =>
      client.post('/payments', input, {
        headers: { 'idempotency-key': crypto.randomUUID() }
      }),
    refresh: (paymentId) => client.post(`/payments/${paymentId}/refresh`, {})
  });
}

export const paymentsApi = createPaymentsApi();
