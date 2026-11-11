const defaultLogger = Object.freeze({ error() {} });

export function createJobRunner({ registry, logger = defaultLogger, clock = () => new Date() } = {}) {
  if (!registry || typeof registry.all !== 'function') throw new TypeError('A job registry is required.');
  const timers = new Map();
  const running = new Set();
  const status = new Map();

  async function run(job) {
    if (running.has(job.name)) return { skipped: true, reason: 'already_running' };
    running.add(job.name);
    const startedAt = clock();
    try {
      const result = await job.run({ startedAt });
      status.set(job.name, { name: job.name, status: 'SUCCEEDED', startedAt, finishedAt: clock(), lastError: null });
      return { skipped: false, result };
    } catch (error) {
      status.set(job.name, { name: job.name, status: 'FAILED', startedAt, finishedAt: clock(), lastError: String(error.message ?? error).slice(0, 1000) });
      logger.error({ error, job: job.name }, 'Background job failed');
      return { skipped: false, error };
    } finally { running.delete(job.name); }
  }

  return Object.freeze({
    async runNow(name) { const job = registry.get(name); if (!job) throw new Error(`Unknown job: ${name}`); return run(job); },
    async start() { for (const job of registry.all()) { await run(job); const timer = setInterval(() => { run(job); }, job.intervalMs); timer.unref?.(); timers.set(job.name, timer); } },
    async stop() { for (const timer of timers.values()) clearInterval(timer); timers.clear(); },
    status: () => registry.all().map((job) => status.get(job.name) ?? { name: job.name, status: 'NEVER_RUN', startedAt: null, finishedAt: null, lastError: null })
  });
}
