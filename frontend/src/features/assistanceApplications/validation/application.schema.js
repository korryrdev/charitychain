export function validateApplication(values, { outstandingBalance } = {}) {
  const errors = {};
  const requestedAmount = Number(values.requestedAmount);
  if (!['TUITION', 'UPKEEP'].includes(values.type)) errors.type = 'Choose tuition or upkeep assistance.';
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) errors.requestedAmount = 'Enter a requested amount above zero.';
  if (values.type === 'TUITION' && outstandingBalance !== undefined && requestedAmount > Number(outstandingBalance)) errors.requestedAmount = 'Tuition support cannot exceed the recorded outstanding fee balance.';
  if (values.type === 'UPKEEP' && requestedAmount > 15000) errors.requestedAmount = 'Upkeep support is limited to KES 15,000.';
  if (String(values.reason ?? '').trim().length < 20) errors.reason = 'Explain the request in at least 20 characters.';
  return errors;
}
