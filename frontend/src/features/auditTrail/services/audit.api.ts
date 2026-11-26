import { httpClient } from '../../../services/httpClient';

export const auditApi = Object.freeze({
  events: (query: string = '') => httpClient.get(`/audit-logs/events${query}`),
  integrity: () => httpClient.get('/audit-logs/integrity'),
});
