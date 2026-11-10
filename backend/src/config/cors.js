import { deepFreeze, env } from './environment.js';

function parseOrigins(environment) {
  const origins = environment.CORS_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [environment.APP_URL];
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
