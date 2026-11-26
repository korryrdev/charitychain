import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserRole, UserSession } from '@/types';
import { api } from '@/lib/api';
import { authStore } from '../../store/auth.store';

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (email: string, role: UserRole) => void;
  registerDonor: (name: string, email: string, password: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signatoryWallet: string;
}

function toHexToken(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return `malkia-token-${hex.padEnd(32, '0')}`;
}

const roleEmails: Record<UserRole, string> = {
  CUSTODIAN: 'pharmacy@malkia.charity',
  COMMITTEE: 'chair@malkia.charity',
  TREASURER: 'treasurer@malkia.charity',
  SIGNATORY: 'signatory1@malkia.charity',
  ADMIN: 'kipyegonaldo@gmail.com',
  DONOR: 'donor@malkia.charity',
  SUBGROUP_REP: 'subgroup@malkia.charity',
  AUDITOR: 'auditor@malkia.charity',
};

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
  return 'DONOR';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('charitychain_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          return {
            ...parsed,
            token: parsed.token || toHexToken(parsed.email),
          };
        }
      }
      const storeSession = (authStore.get() as { session: any; ready: boolean })?.session;
      if (storeSession?.user) {
        return {
          id: storeSession.user.id,
          email: storeSession.user.email,
          name: storeSession.user.name || storeSession.user.email,
          role: mapBackendRoleToUiRole(storeSession.roles),
          token: '',
          walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        };
      }
    } catch {
      // ignore storage errors
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
          token: prev?.email === nextState.session.user.email ? prev?.token || '' : '',
          walletAddress: prev?.walletAddress || '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        }));
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      if (user && user.token) {
        localStorage.setItem('charitychain_session', JSON.stringify(user));
      } else if (!user) {
        localStorage.removeItem('charitychain_session');
      }
    } catch {
      // ignore storage errors
    }
  }, [user]);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    const email = roleEmails[newRole] || user?.email || 'pharmacy@malkia.charity';
    const token = toHexToken(email);
    const updated: UserSession = {
      id: user?.id || `usr-${newRole.toLowerCase()}`,
      email,
      name: email.split('@')[0],
      role: newRole,
      token,
      walletAddress: user?.walletAddress || '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    };
    setUser(updated);
    api.demoLogin({ email, role: newRole }).catch(() => {});
  }, [user]);

  const login = useCallback((email: string, targetRole: UserRole) => {
    const token = toHexToken(email);
    const session: UserSession = {
      id: `usr-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: targetRole,
      token,
      walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    };
    setUser(session);
    setRoleState(targetRole);
    api.demoLogin({ email, role: targetRole }).catch(() => {});
  }, []);

  const registerDonor = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    let loginResult: any = res;
    if (res.requiresVerification && res.developmentVerificationToken) {
      await fetch('/api/v1/public/auth/verify-account', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: res.developmentVerificationToken }),
      });
      loginResult = await api.login({ email, password });
    } else if (res.requiresVerification) {
      throw new Error('Account created! Please check your email to verify your account before signing in.');
    }

    const session: UserSession = {
      id: loginResult.user?.id || res.user?.id || `usr-${Date.now()}`,
      email: loginResult.user?.email || res.user?.email || email,
      name: loginResult.user?.name || res.user?.name || name,
      role: 'DONOR',
      token: loginResult.token || '',
      walletAddress: '0x0000000000000000000000000000000000000000',
    };
    setUser(session);
    setRoleState('DONOR');
    authStore.setSession({
      user: loginResult.user || res.user,
      session: loginResult.session ?? null,
      roles: loginResult.roles ?? ['DONOR'],
      permissions: loginResult.permissions ?? ['donation:create', 'donation:read:self'],
      mfaVerified: Boolean(loginResult.mfaVerified),
    });
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    const roleCode = mapBackendRoleToUiRole(res.roles || (res.role ? [res.role] : ['DONOR']));
    const session: UserSession = {
      id: res.user?.id || `usr-${Date.now()}`,
      email: res.user?.email || email,
      name: res.user?.name || email.split('@')[0],
      role: roleCode,
      token: res.token || '',
      walletAddress: '0x0000000000000000000000000000000000000000',
    };
    setUser(session);
    setRoleState(roleCode);
    authStore.setSession({
      user: res.user,
      session: res.session ?? null,
      roles: res.roles ?? [res.role || 'DONOR'],
      permissions: res.permissions ?? [],
      mfaVerified: Boolean(res.mfaVerified),
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    authStore.clear();
    try {
      localStorage.removeItem('charitychain_session');
    } catch {
      // ignore
    }
  }, []);

  const signatoryWallet = user?.walletAddress || '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        login,
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
