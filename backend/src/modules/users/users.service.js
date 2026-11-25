import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { toUserResponse } from './users.mapper.js';
import { assertCanReadUser, assertCanUpdateUser } from './users.policy.js';
import { usersRepository } from './users.repository.js';
import { authService } from '../auth/auth.service.js';
import { authRepository } from '../auth/auth.repository.js';
import { randomBytes } from 'node:crypto';
import { env } from '../../config/environment.js';
import { resendEmailService } from '../notifications/resendEmail.service.js';
import { ConflictError } from '../../errors/ConflictError.js';

function requireUser(user) {
  if (!user)
    throw new AppError({
      message: 'User not found.',
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      statusCode: 404
    });
  return user;
}

export function createUsersService(repository = usersRepository, authentication = authService, emailService = resendEmailService) {
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
    async deleteManagedAccount(auth, userId) {
      if (auth.user.id === userId) throw new ConflictError('You cannot delete the administrator account currently in use.');
      const user = requireUser(await repository.findById(userId));
      if (user.roles.some((assignment) => assignment.role.code === 'ADMINISTRATOR')) {
        throw new ConflictError('Administrator accounts cannot be deleted through access management.');
      }
      try {
        await authRepository.deleteUser(userId);
      } catch (error) {
        if (error?.code === 'P2003') throw new ConflictError('This account has retained operational records and cannot be permanently deleted. Suspend it instead.');
        throw error;
      }
    },
    async createStaffAccount(input) {
      const existingUser = await authRepository.findUserByEmail(input.email);
      if (existingUser) {
        throw new ConflictError('That email already belongs to a CharityChain account. Use a different email for this staff invitation.');
      }
      const temporaryPassword = randomBytes(18).toString('base64url');
      const user = await authentication.registerStaff({ name: input.name, email: input.email, password: temporaryPassword });
      if (!user?.id) throw new AppError({ message: 'The staff account could not be created.', code: ERROR_CODES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      try {
        const activatedUser = await authRepository.activateUser(input.email);
        if (activatedUser.id !== user.id) {
          throw new ConflictError('That email already belongs to a CharityChain account. Use a different email for this staff invitation.');
        }
        const assigned = await repository.assignRoles(activatedUser.id, [...new Set(input.roles)]);
        const activationUrl = `${env.APP_URL}/auth/login`;
        const dashboardUrl = input.dashboardUrl ?? activationUrl;
        const invitation = {
          user: toUserResponse(assigned),
          temporaryPassword,
          activationUrl,
          dashboardUrl
        };
        const delivery = await emailService.sendStaffInvitation({ recipientName: input.name, email: input.email, temporaryPassword, activationUrl, dashboardUrl, roleName: input.roleName ?? 'CharityChain staff', permissions: invitation.user.permissions });
        return { ...invitation, delivery };
      } catch (error) {
        await authRepository.deleteUser(user.id).catch(() => {});
        throw error;
      }
    },
    async closeOwnAccount(auth, password, headers) {
      await authentication.verifyCurrentPassword(password, headers);
      await repository.closeDonorAccount(auth.user.id);
    }
  };
}

export const usersService = createUsersService();
