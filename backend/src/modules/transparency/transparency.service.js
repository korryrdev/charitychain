'use strict';

import { assertPublicTransparencyEnabled } from './transparency.policy.js';
import { transparencyRepository } from './transparency.repository.js';
import { transparencyAggregationService } from './transparencyAggregation.service.js';
import { sanitizePublicData } from './publicDataSanitizer.js';
export function createTransparencyService({ repository = transparencyRepository, aggregation = transparencyAggregationService, policy = assertPublicTransparencyEnabled } = {}) { return { async dashboard() { policy(); return sanitizePublicData(aggregation.dashboard(await repository.dashboardData())); } }; }
export const transparencyService = createTransparencyService();
