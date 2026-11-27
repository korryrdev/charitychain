import { useCallback } from 'react';
import { useAppContext } from '../../../app/Providers';
import type { AuthResponse, PortalSession } from '../../../types/portal';
import { authApi } from '../services/auth.api';

function sessionFrom(response: AuthResponse | null | undefined): PortalSession | null {
  if (!response?.user) return null;
  // Flags arrive at the top level of auth responses; keep them on the user so ProtectedRoute can read them.
  const user = {
    ...response.user,
    mustChangePassword: response.mustChangePassword ?? response.user.mustChangePassword ?? false,
    mfaEnrollmentRequired: response.mfaEnrollmentRequired ?? response.user.mfaEnrollmentRequired ?? false,
  };
  return {
    user,
    session: response.session ?? null,
    roles: response.roles ?? [],
    permissions: response.permissions ?? [],
    mfaVerified: Boolean(response.mfaVerified),
  };
}

/** Apply a partial auth response (e.g. MFA verify / password change) on top of the current session. */
function mergeSession(current: PortalSession | null, response: AuthResponse | null | undefined): PortalSession | null {
  const fresh = sessionFrom(response);
  if (fresh && fresh.user) {
    return {
      ...fresh,
      roles: response?.roles ?? current?.roles ?? [],
      permissions: response?.permissions ?? current?.permissions ?? [],
      mfaVerified: response?.mfaVerified ?? current?.mfaVerified ?? false,
      user: current?.user ? { ...current.user, ...fresh.user } : fresh.user,
    };
  }
  if (!current?.user || !response) return null;
  return {
    ...current,
    mfaVerified: response.mfaVerified ?? current.mfaVerified,
    user: {
      ...current.user,
      mustChangePassword: response.mustChangePassword ?? current.user.mustChangePassword,
      mfaEnrollmentRequired: response.mfaEnrollmentRequired ?? current.user.mfaEnrollmentRequired,
    },
  };
}

type AuthLoginInput = Parameters<typeof authApi.login>[0];
type AuthVerifyMfaInput = Parameters<typeof authApi.verifyMfa>[0];
type AuthChangePasswordInput = Parameters<typeof authApi.changePassword>[0];

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
      const next = mergeSession(session, response);
      if (next) setSession(next);
      return {
        ...response,
        roles: next?.roles ?? response?.roles ?? [],
        permissions: next?.permissions ?? response?.permissions ?? [],
      };
    },
    [api, session, setSession],
  );
  const changePassword = useCallback(
    async (input: AuthChangePasswordInput) => {
      const response = await api.changePassword(input);
      const next = mergeSession(session, {
        ...response,
        mustChangePassword: false,
        mfaEnrollmentRequired: response?.mfaEnrollmentRequired ?? false,
      });
      if (next) setSession(next);
      return {
        ...response,
        roles: next?.roles ?? response?.roles ?? [],
        permissions: next?.permissions ?? response?.permissions ?? [],
      };
    },
    [api, session, setSession],
  );
  return {
    session,
    user: session?.user ?? null,
    authenticated: Boolean(session?.user),
    ready: authReady,
    login,
    logout,
    verifyMfa,
    changePassword,
    register: api.register,
    registerStudent: api.registerStudent,
    verifyAccount: api.verifyAccount,
    resendVerification: api.resendVerification,
    requestPasswordReset: api.requestPasswordReset,
    resetPassword: api.resetPassword,
    enableMfa: api.enableMfa,
  };
}
