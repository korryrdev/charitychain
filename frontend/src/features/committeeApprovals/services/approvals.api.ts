import { httpClient } from '../../../services/httpClient';

const qs = (input: Record<string, unknown> = {}): string => {
  const entries = Object.entries(input)
    .filter(([, entry]) => entry !== undefined && entry !== null && entry !== '')
    .map(([key, entry]): [string, string] => [key, String(entry)]);
  const value = new URLSearchParams(entries).toString();
  return value ? `?${value}` : '';
};

export const approvalsApi = Object.freeze({
  queue: (filters: Record<string, unknown> = {}) => httpClient.get(`/applications/review${qs(filters)}`),
  application: (id: string) => httpClient.get(`/applications/${id}`),
  rounds: (id: string) => httpClient.get(`/approvals/applications/${id}/rounds`),
  open: (id: string, payload: Record<string, unknown>) => httpClient.post(`/approvals/applications/${id}/rounds`, payload),
  round: (id: string) => httpClient.get(`/approvals/rounds/${id}`),
  decide: (id: string, payload: Record<string, unknown>) => httpClient.post(`/approvals/rounds/${id}/decisions`, payload),
  conflicts: (id: string) => httpClient.get(`/committee/applications/${id}/conflicts`),
  declareConflict: (id: string, payload: Record<string, unknown>) =>
    httpClient.post(`/committee/applications/${id}/conflicts`, payload),
  me: () => httpClient.get('/committee/me'),
});
