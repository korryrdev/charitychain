'use strict';

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';

export function assertCanCreateComplaint(auth) {
  if (!auth?.user?.id || !auth.permissions?.includes(PERMISSIONS.COMPLAINT_CREATE)) {
    throw new AuthorizationError();
  }
}

export function assertCanManageComplaints(auth) {
  if (!auth?.user?.id || !auth.permissions?.includes(PERMISSIONS.COMPLAINT_MANAGE)) {
    throw new AuthorizationError();
  }
}
