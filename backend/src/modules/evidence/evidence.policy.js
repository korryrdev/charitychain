'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';

export function assertCanReadEvidence(auth) {
  if (!auth.permissions.includes(PERMISSIONS.EVIDENCE_READ)) throw new AuthorizationError();
}

export function assertCanManageEvidence(auth) {
  if (!auth.permissions.includes(PERMISSIONS.SYSTEM_ADMINISTER)) throw new AuthorizationError();
}
