import { errorHandler } from '../middleware/errorHandler.js';
import { notFound } from '../middleware/notFound.js';
import { apiRouter } from '../routes/index.js';

export function registerRoutes(app, { api = apiRouter } = {}) {
  if (!app || typeof app.use !== 'function') {
    throw new TypeError('An Express application is required to register routes.');
  }

  app.use('/api/v1', api);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
