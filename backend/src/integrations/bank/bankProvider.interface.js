export function assertBankProvider(provider) { if (!provider || typeof provider.initiate !== 'function') throw new TypeError('A bank provider must implement initiate().'); return provider; }
