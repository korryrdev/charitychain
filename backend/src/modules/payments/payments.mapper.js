import { classifyMpesaResult } from '../../integrations/mpesa/mpesaResultCodes.js';

export function toPaymentAttempt(attempt) {
  const classification =
    attempt.provider === 'MPESA' &&
    (attempt.status === 'FAILED' || attempt.status === 'CANCELLED') &&
    attempt.responseCode
      ? classifyMpesaResult(attempt.responseCode, attempt.responseMessage)
      : null;

  return Object.freeze({
    id: attempt.id,
    donationId: attempt.donationId,
    provider: attempt.provider,
    flow: attempt.flow,
    status: attempt.status,
    amount: attempt.amount.toString(),
    currency: attempt.currency,
    providerRequestId: attempt.providerRequestId,
    providerTransactionId: attempt.providerTransactionId,
    responseCode: attempt.responseCode,
    responseMessage: attempt.responseMessage,
    failureCategory: classification?.category ?? null,
    failureTitle: classification?.title ?? null,
    submittedAt: attempt.submittedAt,
    completedAt: attempt.completedAt,
    failedAt: attempt.failedAt,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt
  });
}
