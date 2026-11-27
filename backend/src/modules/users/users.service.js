import { randomBytes } from 'node:crypto';
import { prisma } from '@charitychain/database';
import { authenticationConfig } from '../../config/authentication.js';
import { env } from '../../config/environment.js';
import { AppError } from '../../errors/AppError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { authRepository } from '../auth/auth.repository.js';
import { authService } from '../auth/auth.service.js';
import { authEngine } from '../auth/betterAuth.js';
import { resendEmailService } from '../notifications/resendEmail.service.js';
import { rolesRepository as defaultRolesRepository } from '../roles/roles.repository.js';
import { toUserResponse } from './users.mapper.js';
import { assertCanManageUser, assertCanReadUser, assertCanUpdateUser } from './users.policy.js';
import { usersRepository } from './users.repository.js';

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
  authentication = authService,
  emailService = resendEmailService,
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
    },
    async deleteManagedAccount(auth, userId) {
      if (auth.user.id === userId) {
        throw new ConflictError('You cannot delete the administrator account currently in use.');
      }
      const user = requireUser(await repository.findById(userId));
      if (user.roles.some((assignment) => assignment.role.code === 'ADMINISTRATOR')) {
        throw new ConflictError(
          'Administrator accounts cannot be deleted through access management.'
        );
      }
      try {
        await authRepository.deleteUser(userId);
      } catch (error) {
        if (error?.code === 'P2003') {
          throw new ConflictError(
            'This account has retained operational records and cannot be permanently deleted. Suspend it instead.'
          );
        }
        throw error;
      }
    },
    async createStaffAccount(input) {
      const existingUser = await authRepository.findUserByEmail(input.email);
      if (existingUser) {
        throw new ConflictError(
          'That email already belongs to a CharityChain account. Use a different email for this staff invitation.'
        );
      }
      const temporaryPassword = randomBytes(18).toString('base64url');
      const user = await authentication.registerStaff({
        name: input.name,
        email: input.email,
        password: temporaryPassword
      });
      if (!user?.id) {
        throw new AppError({
          message: 'The staff account could not be created.',
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          statusCode: 500
        });
      }
      try {
        const activatedUser = await authRepository.activateUser(input.email);
        if (activatedUser.id !== user.id) {
          throw new ConflictError(
            'That email already belongs to a CharityChain account. Use a different email for this staff invitation.'
          );
        }
        const tempPasswordExpiresAt = new Date(Date.now() + authenticationConfig.temporaryPasswordTtlMs);
        await authRepository.markTemporaryPassword(activatedUser.id, tempPasswordExpiresAt);
        const assigned = await repository.assignRoles(activatedUser.id, [...new Set(input.roles)]);
        const activationUrl = `${env.APP_URL}/staff/login`;
        const dashboardUrl = input.dashboardUrl ?? activationUrl;
        const invitation = {
          user: toUserResponse(assigned),
          temporaryPassword,
          activationUrl,
          dashboardUrl
        };
        const delivery = await emailService.sendStaffInvitation({
          recipientName: input.name,
          email: input.email,
          temporaryPassword,
          activationUrl,
          dashboardUrl,
          roleName: input.roleName ?? 'CharityChain staff',
          permissions: invitation.user.permissions,
          temporaryPasswordExpiresInHours: Math.max(
            1,
            Math.round(authenticationConfig.temporaryPasswordTtlMs / 3_600_000)
          )
        });
        return { ...invitation, delivery };
      } catch (error) {
        await authRepository.deleteUser(user.id).catch(() => {});
        throw error;
      }
    },
    async changeOwnPassword(auth, input, context) {
      const result = await authentication.changePassword(auth, input, context);
      return {
        user: toUserResponse(result.user),
        mustChangePassword: false,
        mfaEnrollmentRequired: Boolean(result.mfaEnrollmentRequired)
      };
    },
    async closeOwnAccount(auth, password, headers) {
      await authentication.verifyCurrentPassword(password, headers);
      await repository.closeDonorAccount(auth.user.id);
    }
  };
}

export const usersService = createUsersService();
