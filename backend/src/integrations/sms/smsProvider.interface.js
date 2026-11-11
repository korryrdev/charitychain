export function assertSmsProvider(provider) { if (!provider || typeof provider.send !== 'function') throw new TypeError('An SMS provider must implement send().'); return provider; }
