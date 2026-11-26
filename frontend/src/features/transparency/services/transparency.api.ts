import { httpClient, type HttpClient } from '../../../services/httpClient';

export function createTransparencyApi(client: Pick<HttpClient, 'get'> = httpClient) {
  return Object.freeze({
    dashboard: () => client.get('/public/transparency/dashboard'),
  });
}

export const transparencyApi = createTransparencyApi();
