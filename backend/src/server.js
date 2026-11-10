import { pathToFileURL } from 'node:url';
import { prisma } from '@charitychain/database';
import { createApp } from './app.js';
import { connectDatabase } from './bootstrap/connectDatabase.js';
import { createGracefulShutdown, installSignalHandlers } from './bootstrap/gracefulShutdown.js';
import { startWorkers } from './bootstrap/startWorkers.js';
import { validateEnvironment } from './bootstrap/validateEnvironment.js';
import { env } from './config/environment.js';
import { logger as defaultLogger } from './observability/logger.js';

function listen(app, { port, host }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host);
    server.once('listening', () => resolve(server));
    server.once('error', reject);
  });
}

export async function startServer({
  environment = env,
  database = prisma,
  logger = defaultLogger,
  app,
  workers = [],
  port,
  host = '0.0.0.0',
  installProcessSignalHandlers = true
} = {}) {
  const validatedEnvironment = validateEnvironment(environment);
  await connectDatabase({ database, logger });

  let startedWorkers = [];
  let server;

  try {
    startedWorkers = await startWorkers(workers, { logger });
    const application =
      app ??
      createApp({
        middleware: { applicationLogger: logger }
      });
    server = await listen(application, { port: port ?? validatedEnvironment.PORT, host });

    const address = server.address();
    logger.info(
      { host, port: typeof address === 'object' && address ? address.port : port },
      'CharityChain API listening'
    );

    let removeSignalHandlers = () => {};
    const shutdown = createGracefulShutdown({
      server,
      database,
      workers: startedWorkers,
      logger,
      onComplete: () => removeSignalHandlers()
    });

    if (installProcessSignalHandlers) removeSignalHandlers = installSignalHandlers(shutdown);
    return { app: application, server, shutdown };
  } catch (error) {
    await Promise.allSettled(
      startedWorkers
        .reverse()
        .map((worker) => (typeof worker.stop === 'function' ? worker.stop() : Promise.resolve()))
    );
    await database.$disconnect?.();
    throw error;
  }
}

const isMainModule = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMainModule) {
  startServer().catch((error) => {
    defaultLogger.fatal({ error }, 'CharityChain API startup failed');
    process.exitCode = 1;
  });
}
