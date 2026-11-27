export interface RequiredTextOptions {
  field?: string;
  min?: number;
  max?: number;
}

export function requiredText(
  value: unknown,
  { field = 'This field', min = 1, max = 500 }: RequiredTextOptions = {}
): string | null {
  const text = String(value ?? '').trim();
  if (text.length < min) return `${field} is required.`;
  if (text.length > max) return `${field} must be ${max} characters or fewer.`;
  return null;
}

export function positiveAmount(
  value: unknown,
  { maximum = 10_000_000 }: { maximum?: number } = {}
): string | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount greater than zero.';
  if (amount > maximum) return 'Enter a smaller amount.';
  return null;
}
