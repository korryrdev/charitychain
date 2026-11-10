import { prisma as defaultDatabase } from '@charitychain/database';
import { assertEventName } from './eventNames.js';

function assertInput(input) {
  if (!input || typeof input !== 'object') throw new TypeError('Event input is required.');
  assertEventName(input.eventName);
  for (const key of ['aggregateType', 'idempotencyKey']) {
    if (typeof input[key] !== 'string' || !input[key].trim()) throw new TypeError(`${key} is required.`);
  }
  if (input.aggregateId != null && (typeof input.aggregateId !== 'string' || !input.aggregateId.trim())) {
    throw new TypeError('aggregateId must be a non-empty string when supplied.');
  }
  if (!Object.prototype.hasOwnProperty.call(input, 'payload') || input.payload == null || typeof input.payload !== 'object' || Array.isArray(input.payload)) {
    throw new TypeError('payload must be a plain object.');
  }
  if (input.maximumAttempts != null && (!Number.isInteger(input.maximumAttempts) || input.maximumAttempts < 1 || input.maximumAttempts > 20)) {
    throw new RangeError('maximumAttempts must be an integer between 1 and 20.');
  }
}

export function createEventPublisher({ database = defaultDatabase } = {}) {
  return Object.freeze({
    async publish(input, { transaction = database } = {}) {
      assertInput(input);
      const data = { eventName: input.eventName, aggregateType: input.aggregateType.trim(), aggregateId: input.aggregateId?.trim() ?? null, payload: input.payload, idempotencyKey: input.idempotencyKey.trim(), maximumAttempts: input.maximumAttempts ?? 8, availableAt: input.availableAt ?? new Date() };
      try {
        return await transaction.outboxEvent.create({ data });
      } catch (error) {
        if (error?.code !== 'P2002') throw error;
        return transaction.outboxEvent.findUniqueOrThrow({ where: { idempotencyKey: data.idempotencyKey } });
      }
    }
  });
}

export const eventPublisher = createEventPublisher();
