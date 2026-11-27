export const PAYMENT_METHODS = Object.freeze([
  { value: 'MPESA_STK', label: 'M-Pesa STK Push', hint: 'Confirm the prompt on your phone.' },
  {
    value: 'MPESA_PAYBILL',
    label: 'M-Pesa Paybill',
    hint: 'Use the payment reference issued for the donation.'
  },
  { value: 'BANK', label: 'Bank transfer', hint: 'Use the issued bank payment reference.' }
] as const);

export function normalizeKenyanPhoneNumber(value: unknown): string | null {
  const phoneNumber = String(value ?? '').trim().replace(/[\s().-]/g, '');
  if (/^0[17]\d{8}$/.test(phoneNumber)) return `254${phoneNumber.slice(1)}`;
  if (/^\+?254[17]\d{8}$/.test(phoneNumber)) return phoneNumber.replace(/^\+/, '');
  return null;
}

export function validateDonation(values: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  const amount = Number(values.amount);
  if (!Number.isFinite(amount) || amount <= 0)
    errors.amount = 'Enter a contribution amount greater than zero.';
  if (amount > 10_000_000) errors.amount = 'The maximum online contribution is KES 10,000,000.';
  if (!PAYMENT_METHODS.some((method) => method.value === values.channel))
    errors.channel = 'Choose a supported payment method.';
  if (values.channel === 'MPESA_STK' && !normalizeKenyanPhoneNumber(values.phoneNumber))
    errors.phoneNumber = 'Enter a valid Kenyan mobile number, such as 0712345678 or +254712345678.';
  if (!['UNRESTRICTED', 'TUITION', 'UPKEEP'].includes(String(values.purpose ?? '')))
    errors.purpose = 'Choose a support purpose.';
  return errors;
}
