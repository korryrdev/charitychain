'use strict';

import { ValidationError } from '../errors/ValidationError.js';

/**
 * Validates and converts major currency units (e.g., KES 150.50 or '150.50') to integer minor units (15050).
 * For 'ITM' (items), 1 item = 1 minor unit.
 *
 * @param {number|string|bigint} amount
 * @param {string} [currency='KES']
 * @returns {bigint}
 */
export function toMinorUnits(amount, currency = 'KES') {
  if (amount === undefined || amount === null) {
    throw new ValidationError('Amount is required.');
  }

  if (currency.toUpperCase() === 'ITM') {
    const intVal = BigInt(Math.floor(Number(amount)));
    if (intVal < 0n) {
      throw new ValidationError('Item quantity cannot be negative.');
    }
    return intVal;
  }

  if (typeof amount === 'bigint') {
    return amount;
  }

  const str = String(amount).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    throw new ValidationError(`Invalid money amount format: "${amount}". Must have at most 2 decimal places.`);
  }

  const isNegative = str.startsWith('-');
  const cleanStr = isNegative ? str.slice(1) : str;
  const [whole, fraction = ''] = cleanStr.split('.');
  const paddedFraction = fraction.padEnd(2, '0');
  const minor = BigInt(whole) * 100n + BigInt(paddedFraction);

  return isNegative ? -minor : minor;
}

/**
 * Converts integer minor units to a floating point major units number (e.g. 15050 -> 150.5).
 *
 * @param {number|string|bigint} amountMinor
 * @returns {number}
 */
export function toMajorUnits(amountMinor) {
  const minor = BigInt(amountMinor);
  return Number(minor) / 100;
}

/**
 * Formats integer minor units for display.
 *
 * @param {number|string|bigint} amountMinor
 * @param {string} [currency='KES']
 * @returns {string}
 */
export function formatMoney(amountMinor, currency = 'KES') {
  const curr = currency.toUpperCase();
  const minor = BigInt(amountMinor);

  if (curr === 'ITM') {
    return `${minor.toString()} items`;
  }

  const isNeg = minor < 0n;
  const absVal = isNeg ? -minor : minor;
  const whole = absVal / 100n;
  const frac = absVal % 100n;
  const fracStr = frac.toString().padStart(2, '0');
  const formattedNumber = `${whole.toLocaleString('en-US')}.${fracStr}`;

  return `${isNeg ? '-' : ''}${curr} ${formattedNumber}`;
}

/**
 * Asserts that a value represents a non-negative integer minor units amount.
 *
 * @param {unknown} value
 * @param {string} [fieldName='amount']
 * @returns {bigint}
 */
export function assertValidMinorUnits(value, fieldName = 'amount') {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required.`);
  }

  let minor;
  try {
    minor = BigInt(value);
  } catch {
    throw new ValidationError(`${fieldName} must be a valid integer minor units amount.`);
  }

  if (minor < 0n) {
    throw new ValidationError(`${fieldName} cannot be negative.`);
  }

  return minor;
}

/**
 * Adds two minor unit amounts safely as BigInt.
 *
 * @param {number|string|bigint} a
 * @param {number|string|bigint} b
 * @returns {bigint}
 */
export function add(a, b) {
  return BigInt(a) + BigInt(b);
}

/**
 * Subtracts b from a safely as BigInt. Throws if allowNegative is false and result < 0.
 *
 * @param {number|string|bigint} a
 * @param {number|string|bigint} b
 * @param {boolean} [allowNegative=false]
 * @returns {bigint}
 */
export function subtract(a, b, allowNegative = false) {
  const result = BigInt(a) - BigInt(b);
  if (!allowNegative && result < 0n) {
    throw new ValidationError('Resulting amount cannot be negative.');
  }
  return result;
}

export default {
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  assertValidMinorUnits,
  add,
  subtract
};
