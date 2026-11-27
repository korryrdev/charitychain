import { httpClient, type HttpClient } from '../../../services/httpClient';

export function createRecognitionApi(client: Pick<HttpClient, 'get'> = httpClient) {
  return Object.freeze({
    tiers: () => client.get('/public/recognition/tiers'),
    mine: () => client.get('/recognition/me'),
    history: (query: string = '') => client.get(`/recognition/me/history${query}`),
  });
}

export const recognitionApi = createRecognitionApi();
