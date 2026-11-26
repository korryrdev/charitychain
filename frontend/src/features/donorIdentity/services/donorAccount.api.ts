import { httpClient } from '../../../services/httpClient';

export const donorAccountApi = Object.freeze({
  mine: () => httpClient.get('/users/me'),
  updateProfile: (userId: string, input: Record<string, unknown>) => httpClient.patch(`/users/${userId}/profile`, input),
  closeAccount: (password: string) => httpClient.post('/users/me/close-account', { password, confirmation: 'DELETE' }),
});
