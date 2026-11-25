import { httpClient } from '../../../services/httpClient.js';
export function createTransparencyApi(client = httpClient) { return Object.freeze({ dashboard: () => client.get('/public/transparency/dashboard') }); }
export const transparencyApi = createTransparencyApi();
