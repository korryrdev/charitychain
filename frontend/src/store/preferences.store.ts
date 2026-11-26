export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface PreferencesState {
  theme?: string;
  [key: string]: unknown;
}

export type PreferencesListener = (state: PreferencesState) => void;

export interface PreferencesStore {
  get: () => PreferencesState;
  subscribe: (listener: PreferencesListener) => () => void;
  set: (next: Partial<PreferencesState>) => PreferencesState;
  clear: () => void;
}

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

const defaultStorage: StorageLike =
  typeof localStorage === 'undefined' ? createMemoryStorage() : localStorage;

function readPreferences(storage: StorageLike, key: string): PreferencesState {
  try {
    const saved = storage.getItem(key);
    return saved ? (JSON.parse(saved) as PreferencesState) : {};
  } catch {
    return {};
  }
}

export function createPreferencesStore(storage: StorageLike = defaultStorage): PreferencesStore {
  const key = 'charitychain.preferences';
  const listeners = new Set<PreferencesListener>();
  let state: PreferencesState = readPreferences(storage, key);
  const publish = () => listeners.forEach((listener) => listener(state));
  const save = () => storage.setItem(key, JSON.stringify(state));

  return Object.freeze({
    get: () => state,
    subscribe(listener: PreferencesListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next: Partial<PreferencesState>) {
      state = { ...state, ...next };
      save();
      publish();
      return state;
    },
    clear() {
      state = {};
      storage.removeItem(key);
      publish();
    },
  });
}

export const preferencesStore: PreferencesStore = createPreferencesStore();
