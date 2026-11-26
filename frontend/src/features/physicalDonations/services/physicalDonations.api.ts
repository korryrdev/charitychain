import { httpClient } from '../../../services/httpClient';

const basePath = '/physical-donations';

// Clerk-facing operations. A donor declaration never creates stock or a
// financial record; the clerk records actual receipt before confirmation.
export const physicalDonationsApi = Object.freeze({
  list: () => httpClient.get(basePath),
  get: (id: string) => httpClient.get(`${basePath}/${id}`),
  recordByClerk: (payload: Record<string, unknown>) => httpClient.post(basePath, payload),
  submitForConfirmation: (id: string) => httpClient.post(`${basePath}/${id}/submit`),
  inspect: (id: string, payload: Record<string, unknown>) => httpClient.post(`${basePath}/${id}/inspect`, payload),
  addCashDeposit: (id: string, payload: Record<string, unknown>) =>
    httpClient.post(`${basePath}/${id}/cash-deposits`, payload),
  requestDonorConfirmation: (donationId: string) => httpClient.post(`/confirmations/physical-donations/${donationId}`),
  respondToConfirmation: (payload: Record<string, unknown>) =>
    httpClient.post('/public/confirmations/respond', payload),
});
