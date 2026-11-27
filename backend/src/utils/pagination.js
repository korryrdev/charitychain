'use strict';

/**
 * Encodes an arbitrary cursor payload into a base64url string.
 *
 * @param {Record<string, unknown>} payload
 * @returns {string}
 */
export function encodeCursor(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }
  const jsonStr = JSON.stringify(payload);
  return Buffer.from(jsonStr, 'utf8').toString('base64url');
}

/**
 * Decodes a base64url cursor string into an object.
 * Returns null if the cursor is missing, malformed, or cannot be parsed.
 *
 * @param {string|null|undefined} cursor
 * @returns {Record<string, unknown>|null}
 */
export function decodeCursor(cursor) {
  if (!cursor || typeof cursor !== 'string') {
    return null;
  }
  try {
    const jsonStr = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Packages an array of records (fetched with limit = pageSize + 1) into a standard paginated response.
 *
 * @template T
 * @param {Object} options
 * @param {T[]} options.items - Items fetched from database (up to pageSize + 1)
 * @param {number} options.pageSize - The requested page size
 * @param {function(T): Record<string, unknown>} [options.getCursorData] - Callback to extract cursor fields from the last item
 * @returns {{ items: T[], nextCursor: string|null, hasMore: boolean }}
 */
export function buildCursorPage({ items = [], pageSize = 20, getCursorData }) {
  const hasMore = items.length > pageSize;
  const pageItems = hasMore ? items.slice(0, pageSize) : items;

  let nextCursor = null;
  if (hasMore && pageItems.length > 0) {
    const lastItem = pageItems[pageItems.length - 1];
    const cursorPayload = getCursorData
      ? getCursorData(lastItem)
      : { id: lastItem.id, createdAt: lastItem.createdAt };
    nextCursor = encodeCursor(cursorPayload);
  }

  return {
    items: pageItems,
    nextCursor,
    hasMore
  };
}

export default {
  encodeCursor,
  decodeCursor,
  buildCursorPage
};
