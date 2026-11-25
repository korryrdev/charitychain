import { assertAdministratorRemains } from './roles.policy.js';
import { rolesRepository } from './roles.repository.js';

export function createRolesService(repository = rolesRepository) {
  return {
    list: () => repository.list(),
    create: ({ code, name, description, permissions }) => repository.create({ code, name, description, permissionCodes: [...new Set(permissions)] }),
    assign: (userId, roleCode) => repository.assign(userId, roleCode),
    async remove(userId, roleCode) {
      assertAdministratorRemains(roleCode, await repository.countAssignments(roleCode));
      return repository.remove(userId, roleCode);
    },
    setPermissions: (roleCode, permissions) =>
      repository.setPermissions(roleCode, [...new Set(permissions)]),
    replaceAssignments: (userId, roleCodes) => repository.replaceAssignments(userId, [...new Set(roleCodes)]),
    replaceUserPermissionAccess: (userId, permissionCodes) => repository.replaceUserPermissionAccess(userId, [...new Set(permissionCodes)]),
    deleteIfUnused: (roleCode) => repository.deleteIfUnused(roleCode)
  };
}

export const rolesService = createRolesService();
