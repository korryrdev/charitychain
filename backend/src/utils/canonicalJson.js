'use strict';

/**
 * Deterministically serializes a JavaScript value to canonical JSON (RFC 8785 style).
 * - Object keys are sorted lexicographically by UTF-16 code units.
 * - Array element order is strictly preserved.
 * - Primitives (strings, numbers, booleans, null) follow standard JSON rules.
 * - Undefined object values are omitted (matching JSON.stringify behavior).
 *
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'undefined' || typeof value === 'symbol' || typeof value === 'function') {
      return undefined;
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const elements = value.map((item) => {
      const res = canonicalJson(item);
      return res === undefined ? 'null' : res;
    });
    return `[${elements.join(',')}]`;
  }

  // Plain objects
  const keys = Object.keys(value).sort();
  const pairs = [];

  for (const key of keys) {
    const val = value[key];
    if (typeof val === 'undefined' || typeof val === 'symbol' || typeof val === 'function') {
      continue;
    }
    const serializedVal = canonicalJson(val);
    if (serializedVal !== undefined) {
      pairs.push(`${JSON.stringify(key)}:${serializedVal}`);
    }
  }

  return `{${pairs.join(',')}}`;
}

export default canonicalJson;
