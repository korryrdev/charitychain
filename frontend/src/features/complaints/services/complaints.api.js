import { httpClient } from '../../../services/httpClient.js';

export const complaintsApi = Object.freeze({
  myAppeals: () => httpClient.get('/complaints/appeals/mine'),
  createAppeal: (payload) => httpClient.post('/complaints/appeals', payload)
});
