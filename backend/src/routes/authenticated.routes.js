import { Router } from 'express';
import { auditContext } from '../middleware/auditContext.js';
import { authenticate } from '../middleware/authenticate.js';

export function createAuthenticatedRouter({
  routes = [],
  authenticationMiddleware = authenticate,
  auditMiddleware = auditContext
} = {}) {
  const router = Router();
  for (const definition of routes) {
    if (!definition?.path || typeof definition.router !== 'function') {
      throw new TypeError('Each authenticated route requires a path and an Express router.');
    }
    router.use(
      definition.path,
      authenticationMiddleware,
      auditMiddleware,
      ...(definition.middleware ?? []),
      definition.router
    );
  }
  return router;
}

export const authenticatedRouter = createAuthenticatedRouter();
