import { deepFreeze, env } from './environment.js';

export function createDatabaseConfig(environment = env) {
  return deepFreeze({
    url: environment.DATABASE_URL,
    pool: {
      minimum: environment.DATABASE_POOL_MIN,
      maximum: environment.DATABASE_POOL_MAX
    },
    connectTimeoutMs: environment.DATABASE_CONNECT_TIMEOUT_MS
  });
}

export const databaseConfig = createDatabaseConfig();
