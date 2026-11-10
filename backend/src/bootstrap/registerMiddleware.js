import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { corsConfig } from '../config/cors.js';
import { securityConfig } from '../config/security.js';
import { requestContext } from '../middleware/requestContext.js';
import { csrfProtection } from '../middleware/csrfProtection.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { logger } from '../observability/logger.js';

export function registerMiddleware(
  app,
  { applicationLogger = logger, corsOptions = corsConfig, securityOptions = securityConfig } = {}
) {
  if (!app || typeof app.use !== 'function') {
    throw new TypeError('An Express application is required to register middleware.');
  }

  app.disable('x-powered-by');
  if (securityOptions.trustProxy) app.set('trust proxy', 1);
  app.use(requestContext);
  app.use(pinoHttp({ logger: applicationLogger }));
  app.use(helmet(securityOptions.headers));
  app.use(
    cors({
      ...corsOptions,
      origin(origin, callback) {
        if (!origin || corsOptions.allowedOrigins.includes(origin)) return callback(null, true);
        const error = new Error('Origin is not allowed by CORS policy.');
        error.statusCode = 403;
        return callback(error);
      }
    })
  );
  app.use(
    express.json({
      limit: securityOptions.jsonBodyLimit,
      verify(request, _response, buffer) {
        if (request.originalUrl?.startsWith('/api/v1/webhooks/')) {
          request.rawBody = Buffer.from(buffer);
        }
      }
    })
  );
  app.use(express.urlencoded({ extended: false, limit: securityOptions.jsonBodyLimit }));
  app.use(cookieParser());
  app.use(rateLimit);
  app.use(csrfProtection);

  return app;
}
