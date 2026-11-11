import { prisma } from '@charitychain/database';
import { logger as defaultLogger } from '../observability/logger.js';

export async function connectDatabase({ database = prisma, logger = defaultLogger } = {}) {
  if (!database || typeof database.$connect !== 'function') {
    throw new TypeError('A database client with a $connect method is required.');
  }

  try {
    await database.$connect();
    logger.info('Database connection established');
    return database;
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    throw error;
  }
}
