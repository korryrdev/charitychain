import { httpClient } from '../../../services/httpClient.js';
export const auditApi = Object.freeze({ events: (query = '') => httpClient.get(`/audit-logs/events${query}`), integrity: () => httpClient.get('/audit-logs/integrity') });
