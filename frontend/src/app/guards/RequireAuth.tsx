import React, { useSyncExternalStore } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthContext';
import { authStore } from '../../store/auth.store.js';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { session } = useSyncExternalStore(authStore.subscribe, authStore.get) as {
    session: any;
    ready: boolean;
  };
  const location = useLocation();

  if (!user && !session?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
