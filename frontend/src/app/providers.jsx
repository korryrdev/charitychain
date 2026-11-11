import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createQueryClient } from './queryClient.js';
import { authStore } from '../store/auth.store.js';
import { httpClient } from '../services/httpClient.js';

const AppContext = createContext(null);
const defaultSessionLoader = async () => {
  try {
    const { user } = await httpClient.get('/users/me');
    return {
      user,
      session: null,
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
      mfaVerified: Boolean(user.twoFactorEnabled)
    };
  } catch (error) {
    // An unauthenticated first visit is normal; retain the public experience.
    if ([401, 403].includes(error?.status)) return null;
    throw error;
  }
};
export function AppProviders({ children, sessionLoader = defaultSessionLoader }) {
  const [authState, setAuthState] = useState(() => authStore.get());
  const [queryClient] = useState(() => createQueryClient());
  useEffect(() => authStore.subscribe(setAuthState), []);
  const setSession = useCallback((session) => authStore.setSession(session), []);
  const clearSession = useCallback(() => authStore.clear(), []);
  const value = useMemo(() => ({
    queryClient,
    session: authState.session,
    authReady: authState.ready,
    setSession,
    clearSession,
    sessionLoader,
  }), [authState, clearSession, queryClient, sessionLoader, setSession]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useAppContext() { const value = useContext(AppContext); if (!value) throw new Error('useAppContext must be used within AppProviders.'); return value; }
