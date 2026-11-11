import { usePermissions } from '../hooks/usePermissions.js';
export function PermissionGate({ children, permissions = [], requireAll = false, fallback = null }) { const { hasAnyPermission, hasEveryPermission } = usePermissions(); if (!permissions.length || (requireAll ? hasEveryPermission(permissions) : hasAnyPermission(permissions))) return children; return fallback; }
