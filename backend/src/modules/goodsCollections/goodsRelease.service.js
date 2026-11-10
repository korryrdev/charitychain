'use strict';

import { ConflictError } from '../../errors/ConflictError.js';
import { assertCanReleaseCollection } from './goodsCollections.policy.js';
import { goodsCollectionsRepository } from './goodsCollections.repository.js';
export function createGoodsReleaseService(repository = goodsCollectionsRepository) { return { async release(auth, collectionId) { assertCanReleaseCollection(auth); const collection = await repository.find(collectionId); if (!collection) throw new ConflictError('Goods collection not found.'); if (collection.status !== 'CONFIRMED') throw new ConflictError('Goods may be released only after the student confirms the exact collection.'); try { return await repository.release(collection, auth.user.id); } catch (error) { if (error.message === 'COLLECTION_NOT_CONFIRMED') throw new ConflictError('Goods collection is not confirmed.'); if (error.message === 'RESERVATION_UNAVAILABLE') { await repository.expire(collection, auth.user.id); throw new ConflictError('Reserved stock expired and was returned to available inventory.'); } throw error; } } }; }
export const goodsReleaseService = createGoodsReleaseService();
