'use strict';

export function duplicateCallbackRule({ paymentDuplicates = [], disbursementDuplicates = [] }) {
  return [...paymentDuplicates.map((item) => ({ ruleCode: 'DUPLICATE_CALLBACK', severity: 'CRITICAL', sourceType: 'PAYMENT_CALLBACK', sourceId: item.payloadDigest, title: 'Duplicate payment callback payload', summary: 'The same provider callback payload digest was processed more than once.', evidence: { provider: item.provider, occurrences: item._count.payloadDigest } })), ...disbursementDuplicates.map((item) => ({ ruleCode: 'DUPLICATE_CALLBACK', severity: 'CRITICAL', sourceType: 'DISBURSEMENT_CALLBACK', sourceId: item.payloadHash, title: 'Duplicate disbursement callback payload', summary: 'The same payout callback payload hash was processed more than once.', evidence: { occurrences: item._count.payloadHash } }))];
}
