import { env } from '../config/environment.js';

const requiredEnvironmentKeys = [
  'NODE_ENV',
  'PORT',
  'APP_URL',
  'DATABASE_URL',
  'SESSION_SECRET',
  'ENCRYPTION_KEY'
];

export function validateEnvironment(environment = env) {
  const missingKeys = requiredEnvironmentKeys.filter((key) => {
    const value = environment[key];
    return value === undefined || value === null || value === '';
  });

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment values: ${missingKeys.join(', ')}`);
  }

  return environment;
}

export { requiredEnvironmentKeys };
