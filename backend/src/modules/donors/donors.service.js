import { AppError } from '../../errors/AppError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { createAliasGenerator, normalizeAlias } from './aliasGenerator.service.js';
import { toDonorProfile } from './donors.mapper.js';
import { assertCanManageDonor } from './donors.policy.js';
import { donorsRepository } from './donors.repository.js';

const blockedAliases = new Set([
  'admin',
  'administrator',
  'charitychain',
  'charitychain',
  'official',
  'support'
]);

function requireProfile(profile) {
  if (!profile)
    throw new AppError({
      message: 'Donor profile not found.',
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      statusCode: 404
    });
  return profile;
}

export function createDonorsService(repository = donorsRepository) {
  const generator = createAliasGenerator({ aliasExists: repository.aliasExists });
  return {
    async provision(userId) {
      const existing = await repository.findByUserId(userId);
      if (existing) return toDonorProfile(existing);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const alias = await generator.generate();
        try {
          return toDonorProfile(await repository.create(userId, alias, normalizeAlias(alias)));
        } catch (error) {
          if (error.code !== 'P2002') throw error;
        }
      }
      throw new ConflictError('A unique donor alias could not be reserved. Please retry.');
    },
    async get(auth, donorId) {
      const profile = requireProfile(await repository.findById(donorId));
      assertCanManageDonor(auth, profile.userId);
      return toDonorProfile(profile);
    },
    async getMine(auth) {
      const profile = await repository.findByUserId(auth.user.id);
      return profile ? toDonorProfile(profile) : this.provision(auth.user.id);
    },
    async requestAlias(auth, alias) {
      const profile = requireProfile(await repository.findByUserId(auth.user.id));
      const normalizedAlias = normalizeAlias(alias);
      if (blockedAliases.has(normalizedAlias)) throw new ConflictError('This alias is reserved.');
      if (await repository.aliasExists(normalizedAlias))
        throw new ConflictError('This alias is already in use.');
      return toDonorProfile(
        await repository.submitAlias(profile.id, alias.trim(), normalizedAlias)
      );
    },
    async decideAlias(donorId, approved) {
      const profile = requireProfile(await repository.findById(donorId));
      if (!profile.pendingAlias) throw new ConflictError('There is no pending alias to review.');
      return toDonorProfile(await repository.decideAlias(donorId, approved));
    }
  };
}

export const donorsService = createDonorsService();
