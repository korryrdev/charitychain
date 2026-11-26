import { useSession } from '../../authentication/hooks/useSession';
import {
  defaultAuthorizedPath,
  hasAnyPermission,
  hasEveryPermission,
  hasPermission,
  hasRole,
} from '../permissions';

export interface UsePermissionsResult {
  permissions: string[];
  roles: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions?: string[]) => boolean;
  hasEveryPermission: (permissions?: string[]) => boolean;
  hasRole: (roles?: string[]) => boolean;
  homePath: string;
}

export function usePermissions(): UsePermissionsResult {
  const { session } = useSession();
  return {
    permissions: session?.permissions ?? [],
    roles: session?.roles ?? [],
    hasPermission: (permission: string) => hasPermission(session, permission),
    hasAnyPermission: (permissions?: string[]) => hasAnyPermission(session, permissions),
    hasEveryPermission: (permissions?: string[]) => hasEveryPermission(session, permissions),
    hasRole: (roles?: string[]) => hasRole(session, roles),
    homePath: defaultAuthorizedPath(session),
  };
}
