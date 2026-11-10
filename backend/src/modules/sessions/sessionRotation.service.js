import { authEngine } from '../auth/betterAuth.js';

export function createSessionRotationService(engine = authEngine) {
  return {
    refresh(headers) {
      return engine.api.getSession({
        headers,
        query: { disableCookieCache: true },
        returnHeaders: true
      });
    }
  };
}

export const sessionRotationService = createSessionRotationService();
