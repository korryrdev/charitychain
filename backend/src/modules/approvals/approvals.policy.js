'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
const any = (auth, permissions) => auth.permissions.some((permission) => permissions.includes(permission));
export function assertCanOpenApproval(auth) { if (!any(auth, [PERMISSIONS.APPLICATION_REVIEW, PERMISSIONS.COMMITTEE_MANAGE])) throw new AuthorizationError(); }
export function assertCanDecide(auth) { if (!auth.permissions.includes(PERMISSIONS.APPLICATION_APPROVE)) throw new AuthorizationError(); }
export function assertCanReadApprovals(auth) { if (!any(auth, [PERMISSIONS.APPLICATION_APPROVE, PERMISSIONS.APPLICATION_REVIEW, PERMISSIONS.COMMITTEE_MANAGE])) throw new AuthorizationError(); }
