import { httpClient, type HttpClient } from '../../../services/httpClient';

export function createDonorIdentityApi(client: Pick<HttpClient, 'get' | 'post' | 'request'> = httpClient) {
  return Object.freeze({
    mine: () => client.get('/donors/me'),
    requestAlias: (alias: string) => client.post('/donors/me/alias', { alias }),
    updatePublicSettings: (settings: Record<string, unknown>) =>
      client.request('/public-profile/me', { method: 'PATCH', body: settings }),
  });
}

export const donorIdentityApi = createDonorIdentityApi();
