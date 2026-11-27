'use strict';

/**
 * Executes an async function with exponential backoff and jitter.
 *
 * @template T
 * @param {() => Promise<T>} fn - The async function to execute.
 * @param {Object} [options={}]
 * @param {number} [options.maxRetries=3] - Maximum retry attempts (excluding initial try).
 * @param {number} [options.baseDelayMs=100] - Base delay in milliseconds.
 * @param {number} [options.maxDelayMs=3000] - Cap on delay in milliseconds.
 * @param {number} [options.factor=2] - Exponential multiplier.
 * @param {boolean} [options.jitter=true] - Whether to randomize delay by up to 25%.
 * @param {(err: any) => boolean} [options.shouldRetry] - Predicate to decide whether to retry.
 * @param {(err: any, attempt: number, delayMs: number) => void} [options.onRetry] - Callback on retry.
 * @returns {Promise<T>}
 */
export async function retry(fn, {
  maxRetries = 3,
  baseDelayMs = 100,
  maxDelayMs = 3000,
  factor = 2,
  jitter = true,
  shouldRetry = (err) => err?.retryable !== false,
  onRetry = () => {}
} = {}) {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > maxRetries || !shouldRetry(err)) {
        throw err;
      }

      let delay = Math.min(baseDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);
      if (jitter) {
        // Apply random jitter between 75% and 125% of delay
        const jitterMultiplier = 0.75 + Math.random() * 0.5;
        delay = Math.round(delay * jitterMultiplier);
      }

      onRetry(err, attempt, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export default retry;
