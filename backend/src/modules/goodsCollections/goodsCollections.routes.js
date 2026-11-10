import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { goodsCollectionsController } from './goodsCollections.controller.js';
import { createGoodsCollectionSchema, goodsCollectionParamsSchema, goodsConfirmationSchema } from './goodsCollections.validation.js';
export function createGoodsCollectionsRouter(controller = goodsCollectionsController) { const router = Router(); router.post('/', validateRequest({ body: createGoodsCollectionSchema }), controller.create); router.get('/:collectionId', validateRequest({ params: goodsCollectionParamsSchema }), controller.get); router.post('/:collectionId/release', validateRequest({ params: goodsCollectionParamsSchema }), controller.release); return router; }
export function createPublicGoodsCollectionsRouter(controller = goodsCollectionsController) { const router = Router(); router.post('/confirm', validateRequest({ body: goodsConfirmationSchema }), controller.confirm); return router; }
export const goodsCollectionsRouter = createGoodsCollectionsRouter();
export const publicGoodsCollectionsRouter = createPublicGoodsCollectionsRouter();
