export function requestAuditContext(request) {
  return {
    requestId: request.id,
    actorId: request.auth?.user?.id ?? null,
    sessionId: request.auth?.session?.id ?? null,
    requestMethod: request.method,
    requestPath: request.originalUrl,
    ipAddress: request.ip,
    userAgent: request.get?.('user-agent') ?? null,
  };
}

export function auditContext(request, _response, next) {
  const context = requestAuditContext(request);

  request.audit = Object.freeze({
    ...context,
    event(action, entityType, entityId, metadata) {
      return Object.freeze({
        ...context,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: metadata ?? null,
      });
    },
  });
  next();
}
