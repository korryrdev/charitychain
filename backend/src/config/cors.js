import { deepFreeze, env } from './environment.js';

function parseOrigins(environment) {
  const configuredOrigins = environment.CORS_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origins = configuredOrigins?.length
    ? configuredOrigins
    : [
        environment.APP_URL,
        ...(environment.NODE_ENV === 'development'
          ? ['http://localhost:5173', 'http://127.0.0.1:5173']
          : [])
      ];
  return [...new Set(origins)];
}

export function createCorsConfig(environment = env) {
  return deepFreeze({
    allowedOrigins: parseOrigins(environment),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Authorization', 'Content-Type', 'Idempotency-Key', 'X-CSRF-Token'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600
  });
}

export const corsConfig = createCorsConfig();
