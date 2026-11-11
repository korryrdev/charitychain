import { httpClient } from '../../../services/httpClient.js';

export const applicationsApi = Object.freeze({
  create: (payload) => httpClient.post('/applications', payload),
  mine: (query = {}) => {
    const search = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();
    return httpClient.get(`/applications/mine${search ? `?${search}` : ''}`);
  },
  get: (applicationId) => httpClient.get(`/applications/${applicationId}`),
  submit: (applicationId) => httpClient.post(`/applications/${applicationId}/submit`),
  cancel: (applicationId) => httpClient.post(`/applications/${applicationId}/cancel`)
});
