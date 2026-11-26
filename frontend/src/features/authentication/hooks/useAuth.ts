import { useCallback } from 'react';
import { useAppContext } from '../../../app/Providers';
import { authApi } from '../services/auth.api';

function sessionFrom(response: Record<string, any> | null | undefined) {
  if (!response?.user) return null;
  return {
    user: response.user,
    session: response.session ?? null,
    roles: response.roles ?? [],
    permissions: response.permissions ?? [],
    mfaVerified: Boolean(response.mfaVerified),
  };
}

type AuthLoginInput = Parameters<typeof authApi.login>[0];
type AuthVerifyMfaInput = Parameters<typeof authApi.verifyMfa>[0];

export function useAuth(api = authApi) {
  const { session, authReady, setSession, clearSession } = useAppContext();
  const login = useCallback(
    async (input: AuthLoginInput) => {
      const response = await api.login(input);
      setSession(sessionFrom(response));
      return response;
    },
    [api, setSession],
  );
  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      clearSession();
    }
  }, [api, clearSession]);
  const verifyMfa = useCallback(
    async (input: AuthVerifyMfaInput) => {
      const response = await api.verifyMfa(input);
      const next = sessionFrom(response);
      if (next) setSession(next);
      return response;
    },
    [api, setSession],
  );
  return {
    session,
    user: session?.user ?? null,
    authenticated: Boolean(session?.user),
    ready: authReady,
    login,
    logout,
    verifyMfa,
    register: api.register,
    verifyAccount: api.verifyAccount,
    requestPasswordReset: api.requestPasswordReset,
    resetPassword: api.resetPassword,
    enableMfa: api.enableMfa,
  };
}
