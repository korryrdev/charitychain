export function auditContext(request, _response, next) {
  const context = {
    requestId: request.id,
    actorId: request.auth?.user?.id ?? null,
    sessionId: request.auth?.session?.id ?? null,
    ipAddress: request.ip,
    userAgent: request.get('user-agent') ?? null
  };

  request.audit = Object.freeze({
    ...context,
    event(action, entityType, entityId, metadata) {
      return Object.freeze({
        ...context,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: metadata ?? null
      });
    }
  });
  next();
}
