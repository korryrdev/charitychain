'use strict';

export function detectReferenceDuplicates(candidates) { const counts = new Map(); for (const item of candidates) if (item.providerReference) counts.set(item.providerReference, (counts.get(item.providerReference) ?? 0) + 1); return counts; }
