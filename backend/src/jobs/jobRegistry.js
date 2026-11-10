export function createJobRegistry(jobs = []) {
  const byName = new Map();
  for (const job of jobs) {
    if (!job || typeof job.name !== 'string' || !job.name.trim() || typeof job.run !== 'function') throw new TypeError('Each job requires a name and run function.');
    if (!Number.isInteger(job.intervalMs) || job.intervalMs < 1_000) throw new RangeError(`Job ${job.name} must have an interval of at least 1000ms.`);
    if (byName.has(job.name)) throw new Error(`Duplicate job name: ${job.name}`);
    byName.set(job.name, Object.freeze({ ...job, name: job.name.trim() }));
  }
  return Object.freeze({ all: () => [...byName.values()], get: (name) => byName.get(name) ?? null });
}
