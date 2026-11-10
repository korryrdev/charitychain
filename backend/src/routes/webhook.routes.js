import { Router } from 'express';

export function createWebhookRouter({ routes = [] } = {}) {
  const router = Router();
  for (const definition of routes) {
    if (!definition?.path || typeof definition.router !== 'function') {
      throw new TypeError('Each webhook route requires a path and an Express router.');
    }
    router.use(definition.path, ...(definition.middleware ?? []), definition.router);
  }
  return router;
}

export const webhookRouter = createWebhookRouter();
