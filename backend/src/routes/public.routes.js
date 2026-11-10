import { Router } from 'express';

function mount(router, definition) {
  if (!definition?.path || typeof definition.router !== 'function') {
    throw new TypeError('Each public route requires a path and an Express router.');
  }
  router.use(definition.path, ...(definition.middleware ?? []), definition.router);
}

export function createPublicRouter({ routes = [] } = {}) {
  const router = Router();
  for (const definition of routes) mount(router, definition);
  return router;
}

export const publicRouter = createPublicRouter();
