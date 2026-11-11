import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { assertCanManageSession } from './sessions.policy.js';
import { sessionsRepository } from './sessions.repository.js';

export function createSessionRevocationService(repository = sessionsRepository) {
  return {
    async revoke(auth, sessionId) {
      const session = await repository.findById(sessionId);
      if (!session)
        throw new AppError({
          message: 'Session not found.',
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          statusCode: 404
        });
      assertCanManageSession(auth, session.userId);
      await repository.revoke(sessionId);
    },
    revokeAll(auth, userId, exceptCurrent = false) {
      assertCanManageSession(auth, userId);
      return repository.revokeAll(userId, exceptCurrent ? auth.session.id : undefined);
    }
  };
}

export const sessionRevocationService = createSessionRevocationService();
