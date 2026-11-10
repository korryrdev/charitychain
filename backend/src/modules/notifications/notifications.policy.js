'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanManageNotifications(auth) { if (!auth.permissions.includes(PERMISSIONS.SYSTEM_ADMINISTER)) throw new AuthorizationError(); }
export function assertCanReadNotification(auth, notification) { if (notification.recipientUserId === auth.user.id || auth.permissions.includes(PERMISSIONS.SYSTEM_ADMINISTER)) return; throw new AuthorizationError(); }
