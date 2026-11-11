import { logger as defaultLogger } from '../observability/logger.js';

export async function startWorkers(workers = [], { logger = defaultLogger } = {}) {
  if (!Array.isArray(workers)) throw new TypeError('Workers must be provided as an array.');

  const startedWorkers = [];

  try {
    for (const worker of workers) {
      if (!worker || typeof worker.start !== 'function') {
        throw new TypeError('Each worker must expose a start method.');
      }

      await worker.start();
      startedWorkers.push(worker);
    }
  } catch (error) {
    await Promise.allSettled(
      startedWorkers
        .reverse()
        .map((worker) => (typeof worker.stop === 'function' ? worker.stop() : Promise.resolve()))
    );
    logger.error({ error }, 'Background worker startup failed');
    throw error;
  }

  if (startedWorkers.length > 0) {
    logger.info({ count: startedWorkers.length }, 'Background workers started');
  }

  return startedWorkers;
}
