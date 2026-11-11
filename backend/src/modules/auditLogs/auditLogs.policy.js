'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';

export function assertCanReadAudit(auth) { if (!auth.permissions.includes(PERMISSIONS.AUDIT_READ)) throw new AuthorizationError(); }
export function assertCanWriteAudit(auth) { if (!auth.permissions.includes(PERMISSIONS.SYSTEM_ADMINISTER)) throw new AuthorizationError(); }
