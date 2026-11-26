import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';
import { authStore } from '../store/auth.store';
import { httpClient } from '../services/httpClient';
import { ThemeProvider } from './theme/ThemeContext';
import { I18nProvider } from './i18n/I18nContext';
import { AuthProvider } from './auth/AuthContext';
import type { PortalSession, PortalUser } from '@/types';

const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

export type SessionLoader = () => Promise<PortalSession | null>;

export interface AppContextValue {
  queryClient: ReturnType<typeof createQueryClient>;
  session: PortalSession | null;
  authReady: boolean;
  setSession: (session: PortalSession | null) => void;
  clearSession: () => void;
  sessionLoader: SessionLoader;
}

const AppContext = createContext<AppContextValue | null>(null);

const defaultSessionLoader: SessionLoader = async () => {
  try {
    const { user } = await httpClient.get<{ user: PortalUser }>('/users/me');
    return {
      user,
      session: null,
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
      mfaVerified: Boolean(user.twoFactorEnabled),
    };
  } catch (error: unknown) {
    const status = (error as { status?: number } | null)?.status;
    // An unauthenticated first visit is normal; retain the public experience.
    if (status === 401 || status === 403) return null;
    throw error;
  }
};

export interface AppProvidersProps {
  children: React.ReactNode;
  sessionLoader?: SessionLoader;
}

export function AppProviders({ children, sessionLoader = defaultSessionLoader }: AppProvidersProps) {
  const [authState, setAuthState] = useState(() => authStore.get());
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => authStore.subscribe(setAuthState), []);

  const setSession = useCallback((session: PortalSession | null) => authStore.setSession(session), []);
  const clearSession = useCallback(() => authStore.clear(), []);

  const value = useMemo<AppContextValue>(
    () => ({
      queryClient,
      session: authState.session,
      authReady: authState.ready,
      setSession,
      clearSession,
      sessionLoader,
    }),
    [authState, clearSession, queryClient, sessionLoader, setSession]
  );

  return (
    <QueryClientProvider client={reactQueryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <AppContext.Provider value={value}>{children}</AppContext.Provider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppContext must be used within AppProviders.');
  return value;
}

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AppProviders>{children}</AppProviders>;
};
