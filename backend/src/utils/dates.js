'use strict';

/**
 * Returns current Date in UTC.
 * @returns {Date}
 */
export function nowUtc() {
  return new Date();
}

/**
 * Converts a date or timestamp to an ISO string ending in Z.
 * @param {Date|string|number} date
 * @returns {string}
 */
export function toUtcIso(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString();
}

/**
 * Formats a Date or timestamp as an integer YYYYMMDD for PeriodAnchor on-chain indexing.
 * e.g. November 10, 2026 -> 20261110
 *
 * @param {Date|string|number} [date=new Date()]
 * @returns {number}
 */
export function formatYyyyMmDd(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return parseInt(`${y}${m}${day}`, 10);
}

/**
 * Parses an integer or string YYYYMMDD into a UTC Date at 00:00:00.000Z.
 *
 * @param {number|string} yyyymmdd
 * @returns {Date}
 */
export function parseYyyyMmDd(yyyymmdd) {
  const str = String(yyyymmdd).trim();
  if (!/^\d{8}$/.test(str)) {
    throw new Error(`Invalid YYYYMMDD date format: "${yyyymmdd}"`);
  }
  const year = parseInt(str.slice(0, 4), 10);
  const month = parseInt(str.slice(4, 6), 10) - 1;
  const day = parseInt(str.slice(6, 8), 10);

  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Returns the start of the day in UTC (00:00:00.000Z).
 * @param {Date|string|number} [date=new Date()]
 * @returns {Date}
 */
export function startOfDayUtc(date = new Date()) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the end of the day in UTC (23:59:59.999Z).
 * @param {Date|string|number} [date=new Date()]
 * @returns {Date}
 */
export function endOfDayUtc(date = new Date()) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Returns the quarter (1-4) and year for a given date in UTC.
 * @param {Date|string|number} [date=new Date()]
 * @returns {{ year: number, quarter: number }}
 */
export function getQuarter(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const month = d.getUTCMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;
  return {
    year: d.getUTCFullYear(),
    quarter
  };
}

export default {
  nowUtc,
  toUtcIso,
  formatYyyyMmDd,
  parseYyyyMmDd,
  startOfDayUtc,
  endOfDayUtc,
  getQuarter
};
