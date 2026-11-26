import { httpClient } from '../../services/httpClient';
export const publicDataApi = Object.freeze({ dashboard: () => httpClient.get('/public/transparency/dashboard'), recognitionTiers: () => httpClient.get('/public/recognition/tiers') });
