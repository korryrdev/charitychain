'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';

const has = (auth, permission) => auth.permissions.includes(permission);
export function assertCanManageCommittee(auth) { if (!has(auth, PERMISSIONS.COMMITTEE_MANAGE)) throw new AuthorizationError(); }
export function assertCanReadCommittee(auth) { if (!auth.permissions.some((permission) => [PERMISSIONS.COMMITTEE_MANAGE, PERMISSIONS.APPLICATION_APPROVE, PERMISSIONS.APPLICATION_REVIEW].includes(permission))) throw new AuthorizationError(); }
export function assertCanDeclareConflict(auth, membership) { if (has(auth, PERMISSIONS.COMMITTEE_MANAGE) || membership.userId === auth.user.id) return; throw new AuthorizationError(); }
