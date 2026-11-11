import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, UserSession } from '@/types';
import { api } from '@/lib/api';

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

const defaultSession: UserSession = {
  id: 'usr-pharmacy-1',
  email: 'pharmacy@malkia.charity',
  name: 'Jane Atieno',
  role: 'CUSTODIAN',
  token: toHexToken('pharmacy@malkia.charity'),
  walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('charitychain_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.token) return parsed;
        const email = parsed?.email || 'pharmacy@malkia.charity';
        return {
          ...parsed,
          token: toHexToken(email),
        };
      } catch {}
    }
    return defaultSession;
  });

  const [role, setRoleState] = useState<UserRole>(user?.role || 'CUSTODIAN');

  useEffect(() => {
    if (user) {
      localStorage.setItem('charitychain_session', JSON.stringify(user));
      api.demoLogin({ email: user.email, role: user.role }).catch(() => {});
    } else {
      localStorage.removeItem('charitychain_session');
    }
  }, [user]);

  const setRole = (newRole: UserRole) => {
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
  };

  const login = (email: string, targetRole: UserRole) => {
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
  };

  const registerDonor = async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    const session: UserSession = {
      id: res.user?.id || `usr-${Date.now()}`,
      email: res.user?.email || email,
      name: res.user?.name || name,
      role: 'DONOR',
      token: res.token,
      walletAddress: '0x0000000000000000000000000000000000000000',
    };
    setUser(session);
    setRoleState('DONOR');
  };

  const loginWithPassword = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    const roleCode = (res.role === 'DONOR' || !res.role ? 'DONOR' : res.role) as UserRole;
    const session: UserSession = {
      id: res.user?.id || `usr-${Date.now()}`,
      email: res.user?.email || email,
      name: res.user?.name || email.split('@')[0],
      role: roleCode,
      token: res.token,
      walletAddress: '0x0000000000000000000000000000000000000000',
    };
    setUser(session);
    setRoleState(roleCode);
  };

  const logout = () => {
    setUser(null);
  };

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
