import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertInventoryRead(auth) { if (!auth.permissions.some((permission) => [PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_MANAGE].includes(permission))) throw new AuthorizationError(); }
export function assertInventoryManage(auth) { if (!auth.permissions.includes(PERMISSIONS.INVENTORY_MANAGE)) throw new AuthorizationError(); }
