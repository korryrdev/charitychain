import { httpClient } from '../../../services/httpClient';

export const applicationsApi = Object.freeze({
  create: (payload: Record<string, unknown>) =>
    httpClient.post('/applications', payload, {
      headers: { 'idempotency-key': crypto.randomUUID() },
    }),
  mine: (query: Record<string, unknown> = {}) => {
    const entries = Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]): [string, string] => [key, String(value)]);
    const search = new URLSearchParams(entries).toString();
    return httpClient.get(`/applications/mine${search ? `?${search}` : ''}`);
  },
  get: (applicationId: string) => httpClient.get(`/applications/${applicationId}`),
  submit: (applicationId: string) => httpClient.post(`/applications/${applicationId}/submit`),
  cancel: (applicationId: string) => httpClient.post(`/applications/${applicationId}/cancel`)
});
