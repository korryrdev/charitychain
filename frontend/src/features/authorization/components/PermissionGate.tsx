import type { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';

export interface PermissionGateProps {
  children: ReactNode;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function PermissionGate({
  children,
  permissions = [],
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasAnyPermission, hasEveryPermission } = usePermissions();
  if (
    !permissions.length ||
    (requireAll ? hasEveryPermission(permissions) : hasAnyPermission(permissions))
  ) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
