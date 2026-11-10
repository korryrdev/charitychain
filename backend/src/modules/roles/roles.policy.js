import { ROLES } from '../../constants/roles.js';
import { ConflictError } from '../../errors/ConflictError.js';

export function assertAdministratorRemains(roleCode, administratorCount) {
  if (roleCode === ROLES.ADMINISTRATOR && administratorCount <= 1) {
    throw new ConflictError('The final administrator role assignment cannot be removed.');
  }
}
