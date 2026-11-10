import { randomUUID } from 'node:crypto';
import { prisma as defaultDatabase } from '@charitychain/database';
import { eventBus as defaultEventBus } from './eventBus.js';
import { logger as defaultLogger } from '../observability/logger.js';

const MAX_ERROR_LENGTH = 1_000;

function retryDelayMs(attemptCount) {
  return Math.min(15 * 60_000, 1_000 * 2 ** Math.max(0, attemptCount - 1));
}

export function createOutboxProcessor({ database = defaultDatabase, eventBus = defaultEventBus, logger = defaultLogger, clock = () => new Date(), leaseSeconds = 30, batchSize = 25 } = {}) {
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 5 || leaseSeconds > 300) throw new RangeError('leaseSeconds must be between 5 and 300.');
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) throw new RangeError('batchSize must be between 1 and 100.');

  async function claim(limit = batchSize) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError('limit must be between 1 and 100.');
    const now = clock();
    const leasedUntil = new Date(now.getTime() + leaseSeconds * 1_000);
    const leaseToken = randomUUID();

    return database.$transaction(async (tx) => {
      const candidates = await tx.$queryRaw`
        SELECT "id" FROM "outbox_events"
        WHERE (
          ("status" = 'PENDING' AND "availableAt" <= ${now})
          OR ("status" = 'PROCESSING' AND "leasedUntil" <= ${now})
        )
        ORDER BY "availableAt" ASC, "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      `;
      const events = [];
      for (const candidate of candidates) {
        const updated = await tx.outboxEvent.update({
          where: { id: candidate.id },
          data: { status: 'PROCESSING', attemptCount: { increment: 1 }, leaseToken, leasedUntil, lastError: null }
        });
        events.push(updated);
      }
      return events;
    });
  }

  async function markPublished(event) {
    const updated = await database.outboxEvent.updateMany({
      where: { id: event.id, status: 'PROCESSING', leaseToken: event.leaseToken },
      data: { status: 'PUBLISHED', leaseToken: null, leasedUntil: null, publishedAt: clock(), lastError: null }
    });
    return updated.count === 1;
  }

  async function markFailed(event, error) {
    const message = String(error?.message ?? error ?? 'Unknown outbox processing failure').slice(0, MAX_ERROR_LENGTH);
    const exhausted = event.attemptCount >= event.maximumAttempts;
    const updated = await database.outboxEvent.updateMany({
      where: { id: event.id, status: 'PROCESSING', leaseToken: event.leaseToken },
      data: exhausted
        ? { status: 'FAILED', leaseToken: null, leasedUntil: null, lastError: message, failedAt: clock() }
        : { status: 'PENDING', leaseToken: null, leasedUntil: null, lastError: message, availableAt: new Date(clock().getTime() + retryDelayMs(event.attemptCount)) }
    });
    return { updated: updated.count === 1, exhausted, message };
  }

  async function processOnce({ limit } = {}) {
    const events = await claim(limit ?? batchSize);
    const result = { claimed: events.length, published: 0, retried: 0, failed: 0 };
    for (const event of events) {
      try {
        await eventBus.dispatch(event);
        if (await markPublished(event)) result.published += 1;
      } catch (error) {
        const failure = await markFailed(event, error);
        if (failure.updated && failure.exhausted) result.failed += 1;
        if (failure.updated && !failure.exhausted) result.retried += 1;
        logger.error({ error, eventId: event.id, eventName: event.eventName, exhausted: failure.exhausted }, 'Outbox event dispatch failed');
      }
    }
    return result;
  }

  return Object.freeze({
    claim,
    processOnce,
    createWorker({ pollIntervalMs = 1_000 } = {}) {
      if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < 250 || pollIntervalMs > 60_000) throw new RangeError('pollIntervalMs must be between 250 and 60000.');
      let timer;
      let running = false;
      const run = async () => {
        if (running) return;
        running = true;
        try { await processOnce(); } catch (error) { logger.error({ error }, 'Outbox processor cycle failed'); } finally { running = false; }
      };
      return Object.freeze({
        async start() { await run(); timer = setInterval(run, pollIntervalMs); timer.unref?.(); },
        async stop() { if (timer) clearInterval(timer); timer = undefined; }
      });
    }
  });
}

export const outboxProcessor = createOutboxProcessor();
