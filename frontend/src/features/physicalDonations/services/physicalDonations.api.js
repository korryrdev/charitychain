import { httpClient } from '../../../services/httpClient.js';

const basePath = '/physical-donations';

// Clerk-facing operations. A donor declaration never creates stock or a
// financial record; the clerk records actual receipt before confirmation.
export const physicalDonationsApi = Object.freeze({
  list: () => httpClient.get(basePath),
  get: (id) => httpClient.get(`${basePath}/${id}`),
  recordByClerk: (payload) => httpClient.post(basePath, payload),
  submitForConfirmation: (id) => httpClient.post(`${basePath}/${id}/submit`),
  inspect: (id, payload) => httpClient.post(`${basePath}/${id}/inspect`, payload),
  addCashDeposit: (id, payload) => httpClient.post(`${basePath}/${id}/cash-deposits`, payload),
  requestDonorConfirmation: (donationId) => httpClient.post(`/confirmations/physical-donations/${donationId}`),
  respondToConfirmation: (payload) => httpClient.post('/public/confirmations/respond', payload)
});
