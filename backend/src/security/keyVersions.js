export function createKeyRing({ activeVersion = 'v1', keys } = {}) {
  if (!keys || typeof keys !== 'object' || !Object.keys(keys).length) throw new TypeError('At least one encryption key is required.');
  if (typeof keys[activeVersion] !== 'string' || keys[activeVersion].length < 32) throw new TypeError('The active encryption key must be at least 32 characters.');
  return Object.freeze({ activeVersion, keyFor: (version) => keys[version] ?? null, versions: () => Object.keys(keys) });
}
