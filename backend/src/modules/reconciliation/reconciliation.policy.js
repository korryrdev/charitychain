'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanExecuteReconciliation(auth) { if (!auth.permissions.includes(PERMISSIONS.RECONCILIATION_EXECUTE)) throw new AuthorizationError(); }
export function assertCanReadReconciliation(auth) { if (!auth.permissions.includes(PERMISSIONS.RECONCILIATION_READ)) throw new AuthorizationError(); }
