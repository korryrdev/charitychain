import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserRole, UserSession } from '@/types';
import { api } from '@/lib/api';
import { authApi } from '../../features/authentication/services/auth.api';
import { authStore } from '../../store/auth.store';

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  registerDonor: (name: string, email: string, password: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<{ requiresMfa?: boolean }>;
  logout: () => Promise<void>;
  signatoryWallet: string;
}

function mapBackendRoleToUiRole(roles: string[] = []): UserRole {
  if (roles.includes('SIGNATORY')) return 'SIGNATORY';
  if (roles.includes('TREASURER') || roles.includes('FINANCE_OPERATOR')) return 'TREASURER';
  if (roles.includes('COMMITTEE_MEMBER')) return 'COMMITTEE';
  if (roles.includes('PHARMACY_CUSTODIAN') || roles.includes('INVENTORY_SUPERVISOR') || roles.includes('CLERK')) {
    return 'CUSTODIAN';
  }
  if (roles.includes('AUDITOR') || roles.includes('MEMBER_AUDITOR')) return 'AUDITOR';
  if (roles.includes('ADMINISTRATOR') || roles.includes('SYSTEM_ADMIN')) return 'ADMIN';
  if (roles.includes('SUBGROUP_REP')) return 'SUBGROUP_REP';
  if (roles.includes('STUDENT')) return 'STUDENT';
  return 'DONOR';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearLegacySessionStorage() {
  try {
    localStorage.removeItem('charitychain_session');
  } catch {
    // ignore storage errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    clearLegacySessionStorage();
    const storeSession = (authStore.get() as { session: any; ready: boolean })?.session;
    if (storeSession?.user) {
      return {
        id: storeSession.user.id,
        email: storeSession.user.email,
        name: storeSession.user.name || storeSession.user.email,
        role: mapBackendRoleToUiRole(storeSession.roles),
      };
    }
    return null;
  });

  const [role, setRoleState] = useState<UserRole>(user?.role || 'DONOR');

  useEffect(() => {
    const unsubscribe = authStore.subscribe((nextState: { session: any; ready: boolean }) => {
      if (nextState.session?.user) {
        const mappedRole = mapBackendRoleToUiRole(nextState.session.roles || []);
        setRoleState(mappedRole);
        setUser((prev) => ({
          id: nextState.session.user.id,
          email: nextState.session.user.email,
          name: nextState.session.user.name || nextState.session.user.email,
          role: mappedRole,
          walletAddress: prev?.walletAddress,
        }));
      } else {
        setUser(null);
        setRoleState('DONOR');
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const registerDonor = useCallback(async (name: string, email: string, password: string) => {
    await api.register({ name, email, password });
    throw new Error('Account created! Please check your email to verify your account before signing in.');
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res?.requiresMfa || res?.twoFactorRedirect) {
      return { requiresMfa: true };
    }
    const roles = res.roles?.length ? res.roles : res.role ? [res.role] : ['DONOR'];
    const roleCode = mapBackendRoleToUiRole(roles);
    const session: UserSession = {
      id: res.user?.id || '',
      email: res.user?.email || email,
      name: res.user?.name || email.split('@')[0],
      role: roleCode,
    };
    setUser(session);
    setRoleState(roleCode);
    authStore.setSession({
      user: res.user,
      session: res.session ?? null,
      roles,
      permissions: res.permissions ?? [],
      mfaVerified: Boolean(res.mfaVerified),
    });
    return { requiresMfa: false };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session state even if server session is already gone.
    } finally {
      clearLegacySessionStorage();
      setUser(null);
      setRoleState('DONOR');
      authStore.clear();
    }
  }, []);

  const signatoryWallet = user?.walletAddress || '';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        registerDonor,
        loginWithPassword,
        logout,
        signatoryWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
