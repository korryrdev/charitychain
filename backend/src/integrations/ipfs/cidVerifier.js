'use strict';

const CID_V0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CID_V1 = /^b[a-z2-7]{20,}$/;

export function isValidCid(value) {
  return typeof value === 'string' && (CID_V0.test(value) || CID_V1.test(value));
}

export function assertValidCid(value) {
  if (!isValidCid(value)) throw new TypeError('Invalid IPFS CID.');
  return value;
}
