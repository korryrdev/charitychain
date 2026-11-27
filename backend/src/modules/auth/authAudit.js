import { logger } from '../../observability/logger.js';
import { auditLogsService } from '../auditLogs/auditLogs.service.js';

export const AUTH_AUDIT = Object.freeze({
  REGISTERED: 'auth.user.registered',
  VERIFIED: 'auth.account.verified',
  VERIFICATION_RESENT: 'auth.verification.resent',
  SIGNED_IN: 'auth.signed-in',
  LOGIN_LOCKED: 'auth.login.locked',
  PASSWORD_CHANGED: 'auth.password.changed',
  PASSWORD_RESET_REQUESTED: 'auth.password-reset.requested',
  PASSWORD_RESET_COMPLETED: 'auth.password-reset.completed'
});

/** Best-effort audit trail for authentication events; never blocks the request. */
export function createAuthAudit({ audit = auditLogsService, log = logger } = {}) {
  return {
    async record(action, { actorId = null, outcome = 'SUCCESS', context = {}, metadata } = {}) {
      // Only persist audit rows for HTTP-initiated requests; internal fixture/service calls lack requestPath.
      if (!context?.requestPath) return;
      try {
        await audit.recordFromContext(
          {
            requestId: context.requestId ?? null,
            requestMethod: context.requestMethod ?? null,
            requestPath: context.requestPath ?? null,
            ipAddress: context.ip ?? null,
            userAgent: context.userAgent ?? null
          },
          {
            actorId,
            action,
            outcome,
            entityType: 'User',
            entityId: actorId,
            ...(metadata ? { metadata } : {})
          }
        );
      } catch (error) {
        log.warn({ error, action }, 'Authentication audit event could not be recorded');
      }
    }
  };
}

export const authAudit = createAuthAudit();
