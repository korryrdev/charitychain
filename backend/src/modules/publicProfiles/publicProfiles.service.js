import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { toPublicProfile } from './publicProfile.mapper.js';
import { publicProfilesRepository } from './publicProfiles.repository.js';

export function createPublicProfilesService(repository = publicProfilesRepository) {
  return {
    async getPublic(donorId) {
      const profile = await repository.findPublicById(donorId);
      if (!profile)
        throw new AppError({
          message: 'Public donor profile not found.',
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          statusCode: 404
        });
      return toPublicProfile(profile);
    },
    async list(query) {
      const result = await repository.list(query);
      return { ...result, items: result.items.map(toPublicProfile) };
    },
    async updateMine(auth, settings) {
      const profile = await repository.findByUserId(auth.user.id);
      if (!profile)
        throw new AppError({
          message: 'Donor profile not found.',
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          statusCode: 404
        });
      return repository.updateSettings(profile.id, settings);
    }
  };
}

export const publicProfilesService = createPublicProfilesService();
