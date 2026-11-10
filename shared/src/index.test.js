import { describe, expect, it } from 'vitest';
import { DONATION_STATUS, ROLES } from './index.js';

describe('shared foundation', () => {
  it('exports stable role and status constants', () => {
    expect(ROLES.COMMITTEE_MEMBER).toBe('COMMITTEE_MEMBER');
    expect(DONATION_STATUS.RECONCILED).toBe('RECONCILED');
  });
});
