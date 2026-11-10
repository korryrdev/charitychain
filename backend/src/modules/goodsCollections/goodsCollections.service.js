'use strict';

import { randomBytes } from 'node:crypto';
import { AppError } from '../../errors/AppError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { assertCollectionLimits } from './collectionLimit.service.js';
import { collectionConfirmationService } from './collectionConfirmation.service.js';
import { evaluateGoodsEligibility } from './goodsEligibility.service.js';
import { toGoodsCollection } from './goodsCollections.mapper.js';
import { assertCanReadCollection, assertCanRecordCollection } from './goodsCollections.policy.js';
import { goodsCollectionsRepository } from './goodsCollections.repository.js';

const reference = () => `GOODS-${new Date().getUTCFullYear()}-${randomBytes(6).toString('hex').toUpperCase()}`;
export function createGoodsCollectionsService({ repository = goodsCollectionsRepository, confirmation = collectionConfirmationService } = {}) { return {
  async create(auth, input) { assertCanRecordCollection(auth); const policyRecord = await repository.activePolicy(); if (!policyRecord) throw new AppError({ message: 'No active goods collection policy.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 503 }); const policy = policyRecord.configuration; const context = await repository.eligibilityContext(input.registrationNumber, new Date(Date.now() - policy.cooldownDays * 86400000)); const eligibility = evaluateGoodsEligibility(context, policy); const ids = input.lines.map(({ batchId }) => batchId); if (new Set(ids).size !== ids.length) throw new ConflictError('Each inventory batch may appear only once in a collection.'); const batches = await repository.batches(ids); if (batches.length !== ids.length) throw new ConflictError('One or more inventory batches are unavailable.'); const lines = input.lines.map((line) => { const batch = batches.find(({ id }) => id === line.batchId); return { ...line, categoryCode: batch.item.category.code }; }); assertCollectionLimits(lines, policy); let collection; try { collection = await repository.createWithReservations({ reference: reference(), studentId: context.student.id, semesterId: context.semester.id, clerkUserId: auth.user.id, eligibilitySnapshot: eligibility, policyVersion: policyRecord.version }, lines, new Date(Date.now() + policy.reservationMinutes * 60000)); } catch (error) { if (error.message === 'STOCK_UNAVAILABLE') throw new ConflictError('Requested inventory is unavailable, insufficient, or expired.', { code: ERROR_CODES.INVENTORY_UNAVAILABLE }); if (error.code === 'P2002') throw new ConflictError('The student already has an active goods collection.'); throw error; } return toGoodsCollection(await confirmation.issue(collection)); },
  async get(auth, id) { assertCanReadCollection(auth); const item = await repository.find(id); if (!item) throw new AppError({ message: 'Goods collection not found.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 }); return toGoodsCollection(item); }
}; }
export const goodsCollectionsService = createGoodsCollectionsService();
