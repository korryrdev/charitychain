import { describe, expect, it } from 'vitest';
describe('public tracking input', () => { it('accepts only the issued tracking-ID shape before a private lookup', () => { expect(/^MAL-[A-Z0-9_-]{12}$/.test('MAL-ABCDEF123456')).toBe(true); expect(/^MAL-[A-Z0-9_-]{12}$/.test('MAL-ABC')).toBe(false); }); });
