import { assertAdministratorRemains } from './roles.policy.js';
import { rolesRepository } from './roles.repository.js';

export function createRolesService(repository = rolesRepository) {
  return {
    list: () => repository.list(),
    assign: (userId, roleCode) => repository.assign(userId, roleCode),
    async remove(userId, roleCode) {
      assertAdministratorRemains(roleCode, await repository.countAssignments(roleCode));
      return repository.remove(userId, roleCode);
    },
    setPermissions: (roleCode, permissions) =>
      repository.setPermissions(roleCode, [...new Set(permissions)])
  };
}

export const rolesService = createRolesService();
