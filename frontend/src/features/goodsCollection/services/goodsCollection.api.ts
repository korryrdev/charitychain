import { httpClient } from '../../../services/httpClient';

export const goodsCollectionApi = Object.freeze({
  overview: () => httpClient.get('/goods-collections/student/overview'),
  mine: () => httpClient.get('/goods-collections/mine'),
  get: (collectionId: string) => httpClient.get(`/goods-collections/${collectionId}`),
  confirm: (payload: Record<string, unknown>) => httpClient.post('/public/goods-collections/confirm', payload),
});
