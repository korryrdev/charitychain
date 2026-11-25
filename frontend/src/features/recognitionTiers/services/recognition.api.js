import { httpClient } from '../../../services/httpClient.js';
export function createRecognitionApi(client = httpClient) { return Object.freeze({ tiers: () => client.get('/public/recognition/tiers'), mine: () => client.get('/recognition/me'), history: (query = '') => client.get(`/recognition/me/history${query}`) }); }
export const recognitionApi = createRecognitionApi();
