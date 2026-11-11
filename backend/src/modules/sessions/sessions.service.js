import { assertCanManageSession } from './sessions.policy.js';
import { sessionRevocationService } from './sessionRevocation.service.js';
import { sessionsRepository } from './sessions.repository.js';

function safeSession(session, currentSessionId) {
  return {
    id: session.id,
    userId: session.userId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    current: session.id === currentSessionId
  };
}

export function createSessionsService({
  repository = sessionsRepository,
  revocationService = sessionRevocationService
} = {}) {
  return {
    async list(auth, userId = auth.user.id) {
      assertCanManageSession(auth, userId);
      return (await repository.listByUser(userId)).map((session) =>
        safeSession(session, auth.session.id)
      );
    },
    revoke: (auth, sessionId) => revocationService.revoke(auth, sessionId),
    revokeAll: (auth, userId, exceptCurrent) =>
      revocationService.revokeAll(auth, userId, exceptCurrent)
  };
}

export const sessionsService = createSessionsService();
