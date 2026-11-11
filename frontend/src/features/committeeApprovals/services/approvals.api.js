import { httpClient } from '../../../services/httpClient.js';
const qs = (input = {}) => { const value = new URLSearchParams(Object.entries(input).filter(([, entry]) => entry !== undefined && entry !== null && entry !== '')).toString(); return value ? `?${value}` : ''; };
export const approvalsApi = Object.freeze({
  queue: (filters) => httpClient.get(`/applications/review${qs(filters)}`), application: (id) => httpClient.get(`/applications/${id}`), rounds: (id) => httpClient.get(`/approvals/applications/${id}/rounds`), open: (id, payload) => httpClient.post(`/approvals/applications/${id}/rounds`, payload), round: (id) => httpClient.get(`/approvals/rounds/${id}`), decide: (id, payload) => httpClient.post(`/approvals/rounds/${id}/decisions`, payload), conflicts: (id) => httpClient.get(`/committee/applications/${id}/conflicts`), declareConflict: (id, payload) => httpClient.post(`/committee/applications/${id}/conflicts`, payload), me: () => httpClient.get('/committee/me')
});
