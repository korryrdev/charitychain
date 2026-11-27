import { httpClient } from '../../../services/httpClient';

const query = (values: Record<string, unknown> = {}): string => {
  const entries = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]): [string, string] => [key, String(value)]);
  const text = new URLSearchParams(entries).toString();
  return text ? `?${text}` : '';
};

export const inventoryApi = Object.freeze({
  list: (filters: Record<string, unknown> = {}) => httpClient.get(`/inventory${query(filters)}`),
  get: (batchId: string) => httpClient.get(`/inventory/${batchId}`),
  adjust: (batchId: string, payload: Record<string, unknown>) =>
    httpClient.post(`/inventory/${batchId}/adjustments`, payload, {
      headers: { 'idempotency-key': crypto.randomUUID() },
    }),
  physicalDonations: (filters: Record<string, unknown> = {}) =>
    httpClient.get(`/physical-donations${query(filters)}`),
  physicalDonation: (id: string) => httpClient.get(`/physical-donations/${id}`),
  recordPhysicalDonation: (payload: Record<string, unknown>) =>
    httpClient.post('/physical-donations', payload, {
      headers: { 'idempotency-key': crypto.randomUUID() },
    }),
  submitPhysicalDonation: (id: string) => httpClient.post(`/physical-donations/${id}/submit`),
  requestDonorConfirmation: (id: string) => httpClient.post(`/confirmations/physical-donations/${id}`),
  inspect: (id: string, payload: Record<string, unknown>) => httpClient.post(`/physical-donations/${id}/inspect`, payload),
  receiveDonation: (id: string, payload: Record<string, unknown>) =>
    httpClient.post(`/inventory/receive/physical-donations/${id}`, payload, {
      headers: { 'idempotency-key': crypto.randomUUID() },
    }),
  recordCashDeposit: (id: string, payload: Record<string, unknown>) =>
    httpClient.post(`/physical-donations/${id}/cash-deposits`, payload, {
      headers: { 'idempotency-key': crypto.randomUUID() },
    }),
  collections: () => httpClient.get('/goods-collections/mine'),
  collection: (id: string) => httpClient.get(`/goods-collections/${id}`),
  releaseCollection: (id: string) => httpClient.post(`/goods-collections/${id}/release`),
});
