export function createScheduledJob({ name, intervalMs, execute }) {
  if (typeof execute !== 'function') throw new TypeError(`${name} requires an execute function.`);
  return Object.freeze({ name, intervalMs, run: execute });
}
