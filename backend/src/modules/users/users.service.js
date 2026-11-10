import { prisma } from '@charitychain/database';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { toUserResponse } from './users.mapper.js';
import { assertCanManageUser, assertCanReadUser, assertCanUpdateUser } from './users.policy.js';
import { usersRepository } from './users.repository.js';
import { rolesRepository as defaultRolesRepository } from '../roles/roles.repository.js';
import { authEngine } from '../auth/betterAuth.js';

function requireUser(user) {
  if (!user) {
    throw new AppError({
      message: 'User not found.',
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      statusCode: 404
    });
  }
  return user;
}

export function createUsersService({
  repository = usersRepository,
  rolesRepo = defaultRolesRepository,
  engine = authEngine,
  database = prisma
} = {}) {
  return {
    async get(auth, userId) {
      assertCanReadUser(auth, userId);
      return toUserResponse(requireUser(await repository.findById(userId)));
    },
    async list(query) {
      const result = await repository.list(query);
      return { ...result, items: result.items.map(toUserResponse) };
    },
    async updateProfile(auth, userId, input) {
      assertCanUpdateUser(auth, userId);
      return toUserResponse(await repository.updateProfile(userId, input));
    },
    async updateStatus(userId, status) {
      return toUserResponse(await repository.updateStatus(userId, status));
    },
    async createUser(auth, input) {
      assertCanManageUser(auth);
      const result = await engine.api.signUpEmail({
        body: { name: input.name, email: input.email, password: input.password }
      });
      const created = result?.response?.user ?? result?.user;
      if (input.roles?.length) {
        for (const roleCode of input.roles) {
          await rolesRepo.assign(created.id, roleCode);
        }
      }
      return toUserResponse(requireUser(await repository.findById(created.id)));
    },
    async updateRoles(auth, userId, roleCodes) {
      assertCanManageUser(auth);
      requireUser(await repository.findById(userId));
      await database.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { userId } });
        if (roleCodes?.length) {
          const roles = await tx.role.findMany({ where: { code: { in: roleCodes } } });
          await tx.userRole.createMany({
            data: roles.map((r) => ({ userId, roleId: r.id }))
          });
        }
      });
      await database.outboxEvent.create({
        data: {
          eventName: 'user.roles_updated',
          aggregateType: 'User',
          aggregateId: userId,
          idempotencyKey: `user-roles:${userId}:${Date.now()}`,
          payload: { userId, roles: roleCodes, updatedBy: auth.user.id }
        }
      });
      return toUserResponse(requireUser(await repository.findById(userId)));
    }
  };
}

export const usersService = createUsersService();
