import { httpClient } from '../../../services/httpClient';

export const disbursementsApi = Object.freeze({
  create: (applicationId: string, idempotencyKey?: string) =>
    httpClient.post(`/disbursements/applications/${applicationId}`, { idempotencyKey }),
  forApplication: (applicationId: string) => httpClient.get(`/disbursements/applications/${applicationId}`),
  get: (id: string) => httpClient.get(`/disbursements/${id}`),
  retry: (id: string) => httpClient.post(`/disbursements/${id}/retry`),
  reconcile: (payload: Record<string, unknown>) => httpClient.post('/reconciliation/runs', payload),
  reconciliation: (id: string) => httpClient.get(`/reconciliation/runs/${id}`),
});
