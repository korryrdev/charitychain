import express from 'express';
import { registerMiddleware } from './bootstrap/registerMiddleware.js';
import { registerRoutes } from './bootstrap/registerRoutes.js';

if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

export function createApp({ middleware = {}, routes = {} } = {}) {
  const app = express();
  registerMiddleware(app, middleware);
  registerRoutes(app, routes);
  return app;
}
