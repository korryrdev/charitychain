export function toPaymentAttempt(attempt) {
  return Object.freeze({ id: attempt.id, donationId: attempt.donationId, provider: attempt.provider, flow: attempt.flow,
    status: attempt.status, amount: attempt.amount.toString(), currency: attempt.currency, providerRequestId: attempt.providerRequestId,
    providerTransactionId: attempt.providerTransactionId, responseCode: attempt.responseCode, responseMessage: attempt.responseMessage,
    submittedAt: attempt.submittedAt, completedAt: attempt.completedAt, failedAt: attempt.failedAt, createdAt: attempt.createdAt, updatedAt: attempt.updatedAt });
}
