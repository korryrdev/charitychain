import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '../../src/events/eventBus.js';
import { createEventHandlers } from '../../src/events/eventHandlers.js';
import { EVENT_NAMES } from '../../src/events/eventNames.js';
import { createEventPublisher } from '../../src/events/eventPublisher.js';
import { createOutboxProcessor } from '../../src/events/outboxProcessor.js';

function claimedEvent(overrides = {}) {
  return {
    id: '00000000-0000-0000-0000-000000000111',
    eventName: EVENT_NAMES.DONATION_RECONCILED,
    aggregateType: 'MoneyDonation',
    aggregateId: '00000000-0000-0000-0000-000000000222',
    payload: { amount: '1200.00' },
    idempotencyKey: 'donation:222:reconciled',
    maximumAttempts: 3,
    attemptCount: 0,
    ...overrides
  };
}

function processorDatabase(event) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([event]),
    outboxEvent: {
      update: vi.fn().mockImplementation(async ({ data }) => ({ ...event, ...data, attemptCount: event.attemptCount + 1 }))
    }
  };
  return {
    $transaction: vi.fn(async (callback) => callback(tx)),
    outboxEvent: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    tx
  };
}

describe('Section 33 transactional outbox', () => {
  it('persists supported domain events idempotently through the caller transaction', async () => {
    const existing = claimedEvent();
    const transaction = { outboxEvent: { create: vi.fn().mockRejectedValue({ code: 'P2002' }), findUniqueOrThrow: vi.fn().mockResolvedValue(existing) } };
    const publisher = createEventPublisher({ database: { outboxEvent: {} } });
    const published = await publisher.publish({ eventName: EVENT_NAMES.DONATION_RECONCILED, aggregateType: 'MoneyDonation', aggregateId: existing.aggregateId, payload: { amount: '1200.00' }, idempotencyKey: existing.idempotencyKey }, { transaction });
    expect(published).toBe(existing);
    expect(transaction.outboxEvent.findUniqueOrThrow).toHaveBeenCalledWith({ where: { idempotencyKey: existing.idempotencyKey } });
    await expect(publisher.publish({ eventName: 'unknown.event', aggregateType: 'x', payload: {}, idempotencyKey: 'x' }, { transaction })).rejects.toThrow('Unsupported domain event');
  });

  it('dispatches every registered handler before marking the leased event published', async () => {
    const event = claimedEvent();
    const database = processorDatabase(event);
    const first = vi.fn();
    const second = vi.fn();
    const bus = createEventBus({ handlers: createEventHandlers({ [event.eventName]: [first, second] }) });
    const processor = createOutboxProcessor({ database, eventBus: bus, logger: { debug: vi.fn(), error: vi.fn() }, clock: () => new Date('2026-11-10T10:00:00.000Z') });
    await expect(processor.processOnce()).resolves.toEqual({ claimed: 1, published: 1, retried: 0, failed: 0 });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(database.outboxEvent.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PUBLISHED' }) }));
  });

  it('releases failed events for exponential retry and permanently fails exhausted events', async () => {
    const retryEvent = claimedEvent();
    const retryDatabase = processorDatabase(retryEvent);
    const failingBus = { dispatch: vi.fn().mockRejectedValue(new Error('provider unavailable')) };
    const logger = { error: vi.fn() };
    const processor = createOutboxProcessor({ database: retryDatabase, eventBus: failingBus, logger, clock: () => new Date('2026-11-10T10:00:00.000Z') });
    await expect(processor.processOnce()).resolves.toEqual({ claimed: 1, published: 0, retried: 1, failed: 0 });
    expect(retryDatabase.outboxEvent.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', lastError: 'provider unavailable' }) }));

    const exhaustedEvent = claimedEvent({ attemptCount: 2, maximumAttempts: 3 });
    const exhaustedDatabase = processorDatabase(exhaustedEvent);
    const exhausted = createOutboxProcessor({ database: exhaustedDatabase, eventBus: failingBus, logger, clock: () => new Date('2026-11-10T10:00:00.000Z') });
    await expect(exhausted.processOnce()).resolves.toEqual({ claimed: 1, published: 0, retried: 0, failed: 1 });
    expect(exhaustedDatabase.outboxEvent.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }));
  });
});
