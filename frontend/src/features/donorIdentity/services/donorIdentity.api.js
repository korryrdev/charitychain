import { httpClient } from '../../../services/httpClient.js';
export function createDonorIdentityApi(client = httpClient) { return Object.freeze({ mine: () => client.get('/donors/me'), requestAlias: (alias) => client.post('/donors/me/alias', { alias }), updatePublicSettings: (settings) => client.request('/public-profile/me', { method: 'PATCH', body: settings }) }); }
export const donorIdentityApi = createDonorIdentityApi();
