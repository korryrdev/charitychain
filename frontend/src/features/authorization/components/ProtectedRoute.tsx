import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CHANGE_PASSWORD_PATH, MFA_SETUP_PATH } from '../../authentication/nextStep';
import { loginPathForPath } from '../../authentication/portals';
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
    return (
      <Navigate
        to={loginPathForPath(location.pathname)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (session?.user?.mustChangePassword) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }
  if (session?.user?.mfaEnrollmentRequired) {
    return <Navigate to={MFA_SETUP_PATH} replace />;
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
