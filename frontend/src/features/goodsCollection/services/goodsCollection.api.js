import { httpClient } from '../../../services/httpClient.js';

export const goodsCollectionApi = Object.freeze({
  overview: () => httpClient.get('/goods-collections/student/overview'),
  mine: () => httpClient.get('/goods-collections/mine'),
  get: (collectionId) => httpClient.get(`/goods-collections/${collectionId}`),
  confirm: (payload) => httpClient.post('/public/goods-collections/confirm', payload)
});
