import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../authentication/hooks/useSession';
import { hasAnyPermission, hasEveryPermission, hasRole } from '../permissions';

export interface ProtectedRouteProps {
  children?: ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
}

export function ProtectedRoute({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
}: ProtectedRouteProps) {
  const { session, authenticated, ready } = useSession();
  const location = useLocation();
  if (!ready) {
    return (
      <main className="foundation-shell">
        <p role="status">Checking your access…</p>
      </main>
    );
  }
  if (!authenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }
  const permissionAllowed =
    !permissions.length ||
    (requireAll ? hasEveryPermission(session, permissions) : hasAnyPermission(session, permissions));
  const roleAllowed = !roles.length || hasRole(session, roles);
  if (!permissionAllowed || !roleAllowed) {
    return <Navigate to="/access-denied" replace />;
  }
  return <>{children}</>;
}
