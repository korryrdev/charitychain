import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, UserSession } from '@/types';

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  signatoryWallet: string;
}

const defaultSession: UserSession = {
  id: 'usr-committee-1',
  email: 'chair@malkia.charity',
  name: 'Malkia Committee Chair',
  role: 'COMMITTEE',
  walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('charitychain_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRoleState] = useState<UserRole>(user?.role || 'DONOR');

  useEffect(() => {
    if (user) {
      localStorage.setItem('charitychain_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('charitychain_session');
    }
  }, [user]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
    }
  };

  const login = (email: string, targetRole: UserRole) => {
    const session: UserSession = {
      id: `usr-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: targetRole,
      walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Test Signatory 2
    };
    setUser(session);
    setRoleState(targetRole);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        login,
        logout,
        signatoryWallet: user?.walletAddress || '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

