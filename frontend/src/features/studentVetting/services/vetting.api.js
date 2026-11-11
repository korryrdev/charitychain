import { httpClient } from '../../../services/httpClient.js';

export const studentRecordsApi = Object.freeze({
  mine: () => httpClient.get('/university-records/me')
});

export const vettingApi = Object.freeze({
  policy: () => httpClient.get('/vetting/policy'),
  run: (runId) => httpClient.get(`/vetting/runs/${runId}`)
});
