import { describe, expect, it } from 'vitest';
import { validateDonation } from '../validation/donation.schema.js';
describe('money donation validation', () => { it('requires a valid positive fiat donation request', () => { expect(validateDonation({ amount: 0, channel: 'CARD', purpose: 'OTHER' })).toEqual(expect.objectContaining({ amount: expect.any(String), channel: expect.any(String), purpose: expect.any(String) })); expect(validateDonation({ amount: 1000, channel: 'MPESA_STK', purpose: 'TUITION' })).toEqual({}); }); });
