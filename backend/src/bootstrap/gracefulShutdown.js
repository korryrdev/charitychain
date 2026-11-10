import { logger as defaultLogger } from '../observability/logger.js';

function closeServer(server) {
  if (!server?.listening) return Promise.resolve();

  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export function createGracefulShutdown({
  server,
  database,
  workers = [],
  logger = defaultLogger,
  timeoutMs = 10_000,
  onComplete
}) {
  let shutdownPromise;

  return function shutdown(signal = 'manual') {
    if (shutdownPromise) return shutdownPromise;

    shutdownPromise = (async () => {
      logger.info({ signal }, 'Graceful shutdown started');

      const cleanup = async () => {
        await closeServer(server);
        await Promise.allSettled(
          [...workers]
            .reverse()
            .map((worker) =>
              typeof worker.stop === 'function' ? worker.stop() : Promise.resolve()
            )
        );
        if (database && typeof database.$disconnect === 'function') await database.$disconnect();
      };

      let timeoutIdentifier;
      const timeout = new Promise((_, reject) => {
        timeoutIdentifier = setTimeout(
          () => reject(new Error(`Graceful shutdown exceeded ${timeoutMs}ms.`)),
          timeoutMs
        );
        timeoutIdentifier.unref?.();
      });

      try {
        await Promise.race([cleanup(), timeout]);
        clearTimeout(timeoutIdentifier);
        logger.info('Graceful shutdown completed');
        await onComplete?.();
      } catch (error) {
        clearTimeout(timeoutIdentifier);
        logger.error({ error }, 'Graceful shutdown failed');
        throw error;
      }
    })();

    return shutdownPromise;
  };
}

export function installSignalHandlers(shutdown) {
  if (typeof shutdown !== 'function') throw new TypeError('A shutdown function is required.');

  const handlers = new Map(
    ['SIGINT', 'SIGTERM'].map((signal) => {
      const handler = () => {
        shutdown(signal).catch(() => {
          process.exitCode = 1;
        });
      };
      process.once(signal, handler);
      return [signal, handler];
    })
  );

  return () => {
    for (const [signal, handler] of handlers) process.removeListener(signal, handler);
  };
}
