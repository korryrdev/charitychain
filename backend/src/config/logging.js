import { deepFreeze, env } from './environment.js';

export function createLoggingConfig(environment = env) {
  return deepFreeze({
    level: environment.NODE_ENV === 'test' ? 'silent' : environment.LOG_LEVEL,
    pretty: environment.LOG_PRETTY && environment.NODE_ENV !== 'production',
    redactPaths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.token',
      '*.secret',
      '*.consumerSecret',
      '*.privateKey'
    ]
  });
}

export const loggingConfig = createLoggingConfig();
