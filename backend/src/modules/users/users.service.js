import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { toUserResponse } from './users.mapper.js';
import { assertCanReadUser, assertCanUpdateUser } from './users.policy.js';
import { usersRepository } from './users.repository.js';

function requireUser(user) {
  if (!user)
    throw new AppError({
      message: 'User not found.',
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      statusCode: 404
    });
  return user;
}

export function createUsersService(repository = usersRepository) {
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
    }
  };
}

export const usersService = createUsersService();
