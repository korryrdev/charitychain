'use strict';

import { createHash } from 'node:crypto';

const restrictedKeys = new Set(['password', 'token', 'secret', 'authorization', 'cookie', 'phone', 'email', 'rawpayload', 'ciphertext']);
const hash = (value) => `0x${createHash('sha256').update(value, 'utf8').digest('hex')}`;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).flatMap(([key, nested]) => (
      restrictedKeys.has(key.toLowerCase()) ? [] : [[key, redact(nested)]]
    ));
    return Object.fromEntries(entries);
  }
  return value;
}

export function commitment(snapshot) {
  return snapshot === undefined || snapshot === null ? null : hash(JSON.stringify(canonicalize(snapshot)));
}

export const auditEventBuilder = Object.freeze({
  build({ actorId = null, action, outcome = 'SUCCESS', entityType, entityId = null, requestId = null, requestMethod = null, requestPath = null, ipAddress = null, userAgent = null, reason = null, before = null, after = null, metadata = null, createdAt = new Date() }, previousHash = null) {
    const safeMetadata = metadata === null ? null : redact(metadata);
    const event = {
      actorId, action, outcome, entityType, entityId, requestId, requestMethod, requestPath,
      ipAddressHash: ipAddress ? hash(`ip:${ipAddress}`) : null,
      userAgent: userAgent?.slice(0, 512) ?? null, reason: reason?.slice(0, 1024) ?? null,
      beforeCommitment: commitment(before), afterCommitment: commitment(after), previousHash,
      metadata: safeMetadata, createdAt
    };
    event.eventHash = hash(JSON.stringify(canonicalize({ ...event, createdAt: createdAt.toISOString() })));
    return event;
  },
  verify(event) {
    const payload = {
      actorId: event.actorId, action: event.action, outcome: event.outcome, entityType: event.entityType,
      entityId: event.entityId, requestId: event.requestId, requestMethod: event.requestMethod,
      requestPath: event.requestPath, ipAddressHash: event.ipAddressHash, userAgent: event.userAgent,
      reason: event.reason, beforeCommitment: event.beforeCommitment, afterCommitment: event.afterCommitment,
      previousHash: event.previousHash, metadata: event.metadata, createdAt: event.createdAt.toISOString()
    };
    return hash(JSON.stringify(canonicalize(payload))) === event.eventHash;
  }
});
