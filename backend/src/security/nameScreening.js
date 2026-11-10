'use strict';

const RESERVED_WORDS = new Set([
  'admin',
  'administrator',
  'system',
  'charitychain',
  'malkia',
  'official',
  'treasurer',
  'moderator',
  'signatory',
  'committee',
  'support',
  'root',
  'staff',
  'anonymous',
  'null',
  'undefined'
]);

const BLOCKLIST = new Set([
  'scam',
  'fraud',
  'fake',
  'hacker',
  'malware',
  'terrorist',
  'matusi',
  'shenzi',
  'mbwa',
  'mwizi',
  'kuma',
  'tako',
  'malaya',
  'bastard',
  'asshole',
  'bitch',
  'nigger',
  'faggot',
  'cunt',
  'shit',
  'fuck'
]);

const LEET_MAP = {
  '@': 'a',
  '4': 'a',
  '8': 'b',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '0': 'o',
  '5': 's',
  '$': 's',
  '7': 't',
  '+': 't'
};

function normalizeName(text) {
  let normalized = String(text || '').toLowerCase();
  for (const [leet, char] of Object.entries(LEET_MAP)) {
    normalized = normalized.replaceAll(leet, char);
  }
  return normalized.replace(/[^a-z0-9]/g, '');
}

export function screenDonorName(name) {
  if (!name || typeof name !== 'string') {
    return { allowed: false, reason: 'Name is required.' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { allowed: false, reason: 'Name must be between 2 and 50 characters.' };
  }

  const normalized = normalizeName(trimmed);

  for (const reserved of RESERVED_WORDS) {
    if (normalized === reserved || normalized.includes(reserved)) {
      return { allowed: false, reason: `Name cannot contain reserved term: "${reserved}".` };
    }
  }

  for (const word of BLOCKLIST) {
    if (normalized === word || normalized.includes(word)) {
      return { allowed: false, reason: 'Name contains disallowed or offensive terms.' };
    }
  }

  return { allowed: true, normalizedName: trimmed };
}
