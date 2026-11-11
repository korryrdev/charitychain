'use strict';

export function repeatedConfirmationFailureRule({ failures = [] }) {
  return failures.map((item) => ({ ruleCode: 'REPEATED_CONFIRMATION_FAILURE', severity: 'MEDIUM', sourceType: 'CONFIRMATION_RECIPIENT', sourceId: item.recipientHash, title: 'Repeated confirmation delivery failures', summary: 'The same anonymized recipient has repeated failed confirmation deliveries.', evidence: { failures: item._count.recipientHash } }));
}
