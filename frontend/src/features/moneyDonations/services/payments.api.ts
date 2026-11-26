import { httpClient, type HttpClient } from '../../../services/httpClient';

export function createPaymentsApi(client: Pick<HttpClient, 'post'> = httpClient) {
  return Object.freeze({
    initiate: (input: Record<string, unknown>) =>
      client.post('/payments', input, {
        headers: { 'idempotency-key': crypto.randomUUID() },
      }),
    refresh: (paymentId: string) => client.post(`/payments/${paymentId}/refresh`, {}),
  });
}

export const paymentsApi = createPaymentsApi();
