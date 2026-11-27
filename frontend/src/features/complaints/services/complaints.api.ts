import { httpClient } from '../../../services/httpClient';

export const complaintsApi = Object.freeze({
  myAppeals: () => httpClient.get('/complaints/appeals/mine'),
  createAppeal: (payload: Record<string, unknown>) => httpClient.post('/complaints/appeals', payload),
});
