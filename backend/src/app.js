import express from 'express';
import { registerMiddleware } from './bootstrap/registerMiddleware.js';
import { registerRoutes } from './bootstrap/registerRoutes.js';

export function createApp({ middleware = {}, routes = {} } = {}) {
  const app = express();
  registerMiddleware(app, middleware);
  registerRoutes(app, routes);
  return app;
}
