import { eventHandlers as defaultHandlers } from './eventHandlers.js';

export function createEventBus({ handlers = defaultHandlers, logger } = {}) {
  if (!handlers || typeof handlers.handlersFor !== 'function') {
    throw new TypeError('An event handler registry is required.');
  }

  return Object.freeze({
    async dispatch(event) {
      if (!event?.eventName || !event.id) throw new TypeError('A persisted event with an id and event name is required.');
      const registeredHandlers = handlers.handlersFor(event.eventName);
      for (const handler of registeredHandlers) await handler(event);
      logger?.debug?.({ eventId: event.id, eventName: event.eventName, handlers: registeredHandlers.length }, 'Outbox event dispatched');
      return { handlersExecuted: registeredHandlers.length };
    }
  });
}

export const eventBus = createEventBus();
