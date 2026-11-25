import { httpClient } from '../../../services/httpClient.js';

export const notificationsApi = Object.freeze({
  mine: () => httpClient.get('/notifications/mine')
});
