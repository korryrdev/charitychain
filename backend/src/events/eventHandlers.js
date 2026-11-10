export function createEventHandlers(initialHandlers = {}) {
  const handlers = new Map();

  for (const [eventName, eventHandlers] of Object.entries(initialHandlers)) {
    for (const handler of Array.isArray(eventHandlers) ? eventHandlers : [eventHandlers]) {
      if (typeof handler !== 'function') throw new TypeError(`Handler for ${eventName} must be a function.`);
      handlers.set(eventName, [...(handlers.get(eventName) ?? []), handler]);
    }
  }

  return Object.freeze({
    handlersFor: (eventName) => [...(handlers.get(eventName) ?? [])],
    register(eventName, handler) {
      if (typeof eventName !== 'string' || !eventName) throw new TypeError('An event name is required.');
      if (typeof handler !== 'function') throw new TypeError('An event handler must be a function.');
      handlers.set(eventName, [...(handlers.get(eventName) ?? []), handler]);
      return () => handlers.set(eventName, (handlers.get(eventName) ?? []).filter((item) => item !== handler));
    }
  });
}

export const eventHandlers = createEventHandlers();
