import { describe, expect, it } from 'vitest';
import { createDonationLine, normalisePhysicalDonation, validatePhysicalDonationDeclaration } from '../validation/physicalDonation.schema.js';

describe('physical donation declaration validation', () => {
  it('accepts a valid goods declaration', () => {
    const values = { donorName: 'Amina Noor', donorPhone: '254712345678', kind: 'GOODS', lines: [{ ...createDonationLine(), name: 'Sanitary pads', category: 'Hygiene', quantity: '3', unit: 'pack' }] };
    expect(validatePhysicalDonationDeclaration(values)).toEqual({});
  });

  it('rejects incomplete entries before a check-in summary is prepared', () => {
    const errors = validatePhysicalDonationDeclaration({ donorName: '', donorPhone: '0700', kind: 'GOODS', lines: [{ ...createDonationLine(), name: '', quantity: '0', unit: '' }] });
    expect(errors.donorName).toBeTruthy();
    expect(errors.donorPhone).toBeTruthy();
    expect(errors.lineErrors[0].name).toBeTruthy();
    expect(errors.lineErrors[0].quantity).toBeTruthy();
  });

  it('normalises the declaration without treating it as a confirmed receipt', () => {
    const value = normalisePhysicalDonation({ donorName: ' Amina ', donorPhone: '+254 712 345 678', kind: 'goods', lines: [{ ...createDonationLine(), name: 'Soap', quantity: '2', unit: 'bar' }] });
    expect(value).toMatchObject({ donorName: 'Amina', donorPhone: '254712345678', kind: 'GOODS' });
    expect(value.lines[0].quantity).toBe(2);
  });
});
