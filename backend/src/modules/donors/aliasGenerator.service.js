import { randomInt } from 'node:crypto';
import { ConflictError } from '../../errors/ConflictError.js';

const adjectives = Object.freeze([
  'Brave',
  'Bright',
  'Calm',
  'Caring',
  'Gentle',
  'Golden',
  'Hopeful',
  'Kind',
  'Noble',
  'Radiant',
  'Steady',
  'Warm',
  'Wise'
]);
const nouns = Object.freeze([
  'Acacia',
  'Beacon',
  'Dove',
  'Flame',
  'Horizon',
  'Lion',
  'River',
  'Star',
  'Sunrise',
  'Tree',
  'Wave',
  'Weaver'
]);

export function normalizeAlias(alias) {
  return alias.trim().normalize('NFKC').toLowerCase().replace(/\s+/g, '-');
}

export function createAliasGenerator({ aliasExists, maximumAttempts = 20 }) {
  if (typeof aliasExists !== 'function') throw new TypeError('aliasExists must be provided.');
  return {
    async generate() {
      for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
        const alias = `${adjectives[randomInt(adjectives.length)]}-${nouns[randomInt(nouns.length)]}-${randomInt(1000, 10000)}`;
        if (!(await aliasExists(normalizeAlias(alias)))) return alias;
      }
      throw new ConflictError('A unique donor alias could not be generated. Please retry.');
    }
  };
}
