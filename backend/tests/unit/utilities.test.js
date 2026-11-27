import { describe, it, expect } from 'vitest';
import { canonicalJson } from '../../src/utils/canonicalJson.js';
import {
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  assertValidMinorUnits,
  add,
  subtract
} from '../../src/utils/money.js';
import {
  formatYyyyMmDd,
  parseYyyyMmDd,
  startOfDayUtc,
  endOfDayUtc,
  getQuarter
} from '../../src/utils/dates.js';
import {
  encodeCursor,
  decodeCursor,
  buildCursorPage
} from '../../src/utils/pagination.js';
import { retry } from '../../src/utils/retry.js';
import {
  assert,
  assertSegregation,
  assertState,
  assertRole
} from '../../src/utils/assertions.js';
import { ValidationError } from '../../src/errors/ValidationError.js';
import { AuthorizationError } from '../../src/errors/AuthorizationError.js';
import { ConflictError } from '../../src/errors/ConflictError.js';

describe('G04 & G03: Backend Core Utilities', () => {
  describe('canonicalJson', () => {
    it('sorts keys lexicographically and preserves arrays', () => {
      const obj = { z: 1, a: 2, m: [3, 2, 1], nested: { b: true, a: null } };
      expect(canonicalJson(obj)).toBe('{"a":2,"m":[3,2,1],"nested":{"a":null,"b":true},"z":1}');
    });

    it('ignores undefined values in objects', () => {
      const obj = { b: undefined, a: 'hello' };
      expect(canonicalJson(obj)).toBe('{"a":"hello"}');
    });

    it('preserves null in arrays', () => {
      expect(canonicalJson([1, null, undefined, 4])).toBe('[1,null,null,4]');
    });
  });

  describe('money (G03 integer minor units)', () => {
    it('converts major units to minor units for fiat KES', () => {
      expect(toMinorUnits(500)).toBe(50000n);
      expect(toMinorUnits('12.34')).toBe(1234n);
      expect(toMinorUnits(0.5)).toBe(50n);
      expect(toMinorUnits('100.5')).toBe(10050n);
      expect(toMinorUnits(10n)).toBe(10n);
    });

    it('converts item counts for ITM currency', () => {
      expect(toMinorUnits(25, 'ITM')).toBe(25n);
      expect(toMinorUnits('10', 'ITM')).toBe(10n);
    });

    it('rejects invalid currency amounts', () => {
      expect(() => toMinorUnits('12.345')).toThrow(ValidationError);
      expect(() => toMinorUnits('abc')).toThrow(ValidationError);
      expect(() => toMinorUnits(-5, 'ITM')).toThrow(ValidationError);
    });

    it('converts minor units back to major units number', () => {
      expect(toMajorUnits(50000n)).toBe(500);
      expect(toMajorUnits(1234)).toBe(12.34);
    });

    it('formats money for display', () => {
      expect(formatMoney(10050n, 'KES')).toBe('KES 100.50');
      expect(formatMoney(5n, 'ITM')).toBe('5 items');
    });

    it('assertValidMinorUnits checks non-negative integers', () => {
      expect(assertValidMinorUnits(100n)).toBe(100n);
      expect(assertValidMinorUnits('250')).toBe(250n);
      expect(() => assertValidMinorUnits(-10n)).toThrow(ValidationError);
      expect(() => assertValidMinorUnits('invalid')).toThrow(ValidationError);
    });

    it('add and subtract operate on BigInt', () => {
      expect(add(100n, 50n)).toBe(150n);
      expect(subtract(100n, 40n)).toBe(60n);
      expect(() => subtract(50n, 100n)).toThrow(ValidationError);
      expect(subtract(50n, 100n, true)).toBe(-50n);
    });
  });

  describe('dates', () => {
    it('formats and parses YYYYMMDD integers', () => {
      const date = new Date(Date.UTC(2026, 10, 10, 15, 30, 0)); // Nov 10, 2026
      const yyyymmdd = formatYyyyMmDd(date);
      expect(yyyymmdd).toBe(20261110);

      const parsed = parseYyyyMmDd(20261110);
      expect(parsed.getUTCFullYear()).toBe(2026);
      expect(parsed.getUTCMonth()).toBe(10); // Nov is 10
      expect(parsed.getUTCDate()).toBe(10);
      expect(parsed.getUTCHours()).toBe(0);
    });

    it('returns startOfDayUtc and endOfDayUtc', () => {
      const date = new Date('2026-11-10T14:32:00Z');
      const start = startOfDayUtc(date);
      expect(start.toISOString()).toBe('2026-11-10T00:00:00.000Z');
      const end = endOfDayUtc(date);
      expect(end.toISOString()).toBe('2026-11-10T23:59:59.999Z');
    });

    it('calculates quarterly period', () => {
      expect(getQuarter(new Date('2026-02-15T00:00:00Z'))).toEqual({ year: 2026, quarter: 1 });
      expect(getQuarter(new Date('2026-05-15T00:00:00Z'))).toEqual({ year: 2026, quarter: 2 });
      expect(getQuarter(new Date('2026-11-10T00:00:00Z'))).toEqual({ year: 2026, quarter: 4 });
    });
  });

  describe('pagination', () => {
    it('encodes and decodes cursor strings', () => {
      const payload = { id: 'test-uuid', seq: 42 };
      const encoded = encodeCursor(payload);
      expect(typeof encoded).toBe('string');
      expect(decodeCursor(encoded)).toEqual(payload);
    });

    it('returns null on invalid cursor', () => {
      expect(decodeCursor('invalid-base64-json??')).toBeNull();
      expect(decodeCursor(null)).toBeNull();
    });

    it('builds cursor page with hasMore and nextCursor', () => {
      const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const page = buildCursorPage({ items, pageSize: 2 });
      expect(page.items).toHaveLength(2);
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBeTruthy();
      expect(decodeCursor(page.nextCursor)).toEqual({ id: '2', createdAt: undefined });
    });
  });

  describe('retry', () => {
    it('retries failing operation until success', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('Temporary glitch');
        return 'success';
      };

      const result = await retry(fn, { maxRetries: 3, baseDelayMs: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('fails if maxRetries exceeded', async () => {
      const fn = async () => {
        throw new Error('Permanent failure');
      };

      await expect(retry(fn, { maxRetries: 2, baseDelayMs: 5 })).rejects.toThrow('Permanent failure');
    });
  });

  describe('assertions (FR-AUTH-03 Segregation of Duties)', () => {
    it('asserts condition or throws ValidationError', () => {
      expect(() => assert(true)).not.toThrow();
      expect(() => assert(false, 'Must be true')).toThrow(ValidationError);
    });

    it('assertSegregation blocks self-approval/verification', () => {
      expect(() => assertSegregation('user-1', 'user-2')).not.toThrow();
      expect(() => assertSegregation('user-1', 'user-1')).toThrow(AuthorizationError);
    });

    it('assertState checks valid transitions', () => {
      expect(() => assertState('SUBMITTED', ['SUBMITTED', 'UNDER_REVIEW'])).not.toThrow();
      expect(() => assertState('DRAFT', ['APPROVED', 'AUTHORIZED'])).toThrow(ConflictError);
    });

    it('assertRole verifies user permissions', () => {
      expect(() => assertRole(['COMMITTEE_MEMBER'], ['COMMITTEE_MEMBER', 'TREASURER'])).not.toThrow();
      expect(() => assertRole(['SUBGROUP_REP'], ['TREASURER', 'SIGNATORY'])).toThrow(AuthorizationError);
    });
  });
});

