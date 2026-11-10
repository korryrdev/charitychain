'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanRecordCollection(auth) { if (!auth.permissions.includes(PERMISSIONS.GOODS_COLLECTION_RECORD)) throw new AuthorizationError(); }
export function assertCanReleaseCollection(auth) { if (!auth.permissions.includes(PERMISSIONS.GOODS_COLLECTION_RELEASE)) throw new AuthorizationError(); }
export function assertCanReadCollection(auth) { if (!auth.permissions.some((permission) => [PERMISSIONS.GOODS_COLLECTION_RECORD, PERMISSIONS.GOODS_COLLECTION_RELEASE, PERMISSIONS.INVENTORY_READ].includes(permission))) throw new AuthorizationError(); }
