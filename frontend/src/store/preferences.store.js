function createMemoryStorage() { const values = new Map(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; }
const defaultStorage = typeof localStorage === 'undefined' ? createMemoryStorage() : localStorage;
function readPreferences(storage, key) {
  try { const saved = storage.getItem(key); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
}
export function createPreferencesStore(storage = defaultStorage) { const key = 'charitychain.preferences'; const listeners = new Set(); let state = readPreferences(storage, key); const publish = () => listeners.forEach((listener) => listener(state)); const save = () => storage.setItem(key, JSON.stringify(state)); return Object.freeze({ get: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, set(next) { state = { ...state, ...next }; save(); publish(); return state; }, clear() { state = {}; storage.removeItem(key); publish(); } }); }
export const preferencesStore = createPreferencesStore();
