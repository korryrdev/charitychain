import { httpClient } from '../../../services/httpClient.js';

export const donorAccountApi = Object.freeze({
  mine: () => httpClient.get('/users/me'),
  updateProfile: (userId, input) => httpClient.patch(`/users/${userId}/profile`, input),
  closeAccount: (password) => httpClient.post('/users/me/close-account', { password, confirmation: 'DELETE' })
});
