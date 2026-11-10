'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanCreateDisbursement(auth) { if (!auth.permissions.includes(PERMISSIONS.DISBURSEMENT_CREATE)) throw new AuthorizationError(); }
export function assertCanExecuteDisbursement(auth) { if (!auth.permissions.includes(PERMISSIONS.DISBURSEMENT_EXECUTE)) throw new AuthorizationError(); }
export function assertCanReadDisbursement(auth) { if (!auth.permissions.includes(PERMISSIONS.DISBURSEMENT_READ)) throw new AuthorizationError(); }
