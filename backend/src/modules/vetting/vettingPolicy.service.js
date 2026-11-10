import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { assertCanManageVettingPolicy } from './vetting.policy.js';
import { vettingRepository } from './vetting.repository.js';
export const DEFAULT_VETTING_POLICY = Object.freeze({ weights: { microPayment: 25, examPeriodPayment: 15, financeBlock: 15, aidReliance: 15, unmetBalance: 30 }, penalties: { previousAssistancePerRecord: 5, maximumPreviousAssistance: 10 }, thresholds: { verifiedScore: 70, manualReviewScore: 45, microPaymentMaximum: 5000, minimumMicroPayments: 3, examPaymentWindowDays: 3, examPaymentOccurrencesForFullScore: 2, financeBlocksForFullScore: 2, balanceRatioForFullScore: 0.5, previousAssistanceLookbackRecords: 2 } });
export function createVettingPolicyService(repository = vettingRepository) { return { async active() { const policy = await repository.activePolicy(); if (!policy) throw new AppError({ message: 'No active vetting policy is configured.', code: ERROR_CODES.VETTING_FAILED, statusCode: 503, expose: true }); return policy; }, async create(auth, input) { assertCanManageVettingPolicy(auth); return repository.createPolicy({ version: input.version, name: input.name, configuration: input.configuration, createdByUserId: auth.user.id }); } }; }
export const vettingPolicyService = createVettingPolicyService();
