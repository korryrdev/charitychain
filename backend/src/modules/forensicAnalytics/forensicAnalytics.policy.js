'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanReadForensics(auth) { if (!auth.permissions.includes(PERMISSIONS.FORENSICS_READ)) throw new AuthorizationError(); }
export function assertCanInvestigate(auth) { if (!auth.permissions.includes(PERMISSIONS.FORENSICS_INVESTIGATE)) throw new AuthorizationError(); }
