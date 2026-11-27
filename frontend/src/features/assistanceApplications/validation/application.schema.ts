export const MAX_UPKEEP_AMOUNT = 15000;
export const MAX_UNVERIFIED_TUITION_AMOUNT = 150000;
export const MIN_REASON_LENGTH = 20;
export const MAX_REASON_LENGTH = 2000;

export interface ApplicationValidationOptions {
  outstandingBalance?: number | string | null;
}

export function parseRequestedAmount(rawValue: unknown): number {
  const normalized = String(rawValue ?? '')
    .replace(/,/g, '')
    .trim();
  if (!normalized) return Number.NaN;
  return Number(normalized);
}

export function validateApplication(
  values: Record<string, unknown>,
  { outstandingBalance }: ApplicationValidationOptions = {}
): Record<string, string> {
  const errors: Record<string, string> = {};
  const requestedAmount = parseRequestedAmount(values.requestedAmount);
  const type = String(values.type ?? '');

  if (!['TUITION', 'UPKEEP'].includes(type)) {
    errors.type = 'Choose tuition or upkeep assistance.';
  }

  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    errors.requestedAmount = 'Enter a requested amount above zero.';
  } else if (type === 'TUITION') {
    if (outstandingBalance !== undefined && outstandingBalance !== null) {
      const balance = Number(outstandingBalance);
      if (balance <= 0) {
        errors.requestedAmount = 'Your recorded semester fee balance is already cleared.';
      } else if (requestedAmount > balance) {
        errors.requestedAmount =
          'Tuition support cannot exceed the recorded outstanding fee balance.';
      }
    } else if (requestedAmount > MAX_UNVERIFIED_TUITION_AMOUNT) {
      errors.requestedAmount =
        'Tuition support cannot exceed KES 150,000 without a synced fee statement.';
    }
  } else if (type === 'UPKEEP' && requestedAmount > MAX_UPKEEP_AMOUNT) {
    errors.requestedAmount = 'Upkeep support is limited to KES 15,000.';
  }

  const trimmedReason = String(values.reason ?? '').trim();
  if (trimmedReason.length < MIN_REASON_LENGTH) {
    errors.reason = 'Explain the request in at least 20 characters.';
  } else if (trimmedReason.length > MAX_REASON_LENGTH) {
    errors.reason = 'Keep the explanation within 2,000 characters.';
  }

  return errors;
}
