import type { PortalSession } from '@/types';

export interface AuthStoreState {
  session: PortalSession | null;
  ready: boolean;
}

export type AuthStoreListener = (state: AuthStoreState) => void;

export interface AuthStore {
  get: () => AuthStoreState;
  subscribe: (listener: AuthStoreListener) => () => void;
  setSession: (session: PortalSession | null) => void;
  clear: () => void;
}

export function createAuthStore(): AuthStore {
  let state: AuthStoreState = { session: null, ready: false };
  const listeners = new Set<AuthStoreListener>();
  const publish = () => listeners.forEach((listener) => listener(state));
  return Object.freeze({
    get: () => state,
    subscribe(listener: AuthStoreListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setSession(session: PortalSession | null) {
      state = { session, ready: true };
      publish();
    },
    clear() {
      state = { session: null, ready: true };
      publish();
    },
  });
}

export const authStore: AuthStore = createAuthStore();
