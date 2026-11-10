'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';

export function assertCanReadBlockchainAudit(auth) {
  if (!auth.permissions.includes(PERMISSIONS.AUDIT_READ)) throw new AuthorizationError();
}

export function assertCanManageBlockchainAudit(auth) {
  if (!auth.permissions.includes(PERMISSIONS.SYSTEM_ADMINISTER)) throw new AuthorizationError();
}
