import { describe, expect, it } from 'vitest';
import { formatCurrency } from './currency.js';
import { maskValue } from './masking.js';
import { statusLabel, statusTone } from './statuses.js';
import { positiveAmount, requiredText } from '../validation/common.schema.js';
import { validateKenyanPhone } from '../validation/phone.schema.js';

describe('shared frontend utilities', () => {
  it('formats money and masks protected values', () => { expect(formatCurrency(1250)).toContain('1,250.00'); expect(maskValue('254700123456')).toBe('••••••••3456'); });
  it('maps workflow states to readable labels and tones', () => { expect(statusLabel('AWAITING_APPROVALS')).toBe('Awaiting approvals'); expect(statusTone('RECONCILED')).toBe('success'); expect(statusTone('FAILED')).toBe('danger'); });
  it('validates shared amount, text, and phone inputs', () => { expect(requiredText('')).toBe('This field is required.'); expect(positiveAmount(0)).toBe('Enter an amount greater than zero.'); expect(validateKenyanPhone('254700123456')).toBeNull(); expect(validateKenyanPhone('0700123456')).toContain('Kenyan'); });
});
