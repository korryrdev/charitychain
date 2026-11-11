import { describe, expect, it } from 'vitest';
import { validateApplication } from '../validation/application.schema.js';

describe('assistance application validation', () => {
  it('does not allow tuition requests to exceed the verified outstanding balance', () => {
    expect(validateApplication({ type: 'TUITION', requestedAmount: '5000', reason: 'I need urgent fee assistance for the current semester.' }, { outstandingBalance: '4000' }).requestedAmount).toContain('cannot exceed');
  });
  it('accepts a supported upkeep request within the policy cap', () => {
    expect(validateApplication({ type: 'UPKEEP', requestedAmount: '12000', reason: 'I need short-term upkeep support while I complete the current semester.' })).toEqual({});
  });
});
