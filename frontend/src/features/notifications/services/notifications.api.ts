import { httpClient } from '../../../services/httpClient';

export const notificationsApi = Object.freeze({
  mine: () => httpClient.get('/notifications/mine')
});
