import { httpClient } from '../../../services/httpClient';

export const forensicsApi = Object.freeze({
  scan: () => httpClient.post('/forensics/scan', {}),
  anomalies: () => httpClient.get('/forensics/anomalies'),
  anomaly: (id: string) => httpClient.get(`/forensics/anomalies/${id}`),
  open: (id: string) => httpClient.post(`/forensics/anomalies/${id}/investigation`, {}),
  update: (id: string, payload: Record<string, unknown>) =>
    httpClient.request(`/forensics/anomalies/${id}/investigation`, { method: 'PATCH', body: payload }),
});
