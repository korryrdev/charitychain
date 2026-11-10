'use strict';

const privateKeys = new Set(['id', 'userid', 'actorid', 'studentid', 'phone', 'email', 'destination', 'destinationreference', 'providertransactionid', 'providerrequestid', 'trackingsecrethash', 'ipaddresshash', 'requestid', 'rawpayload', 'encryptedcontent']);
export function sanitizePublicData(value) {
  if (Array.isArray(value)) return value.map(sanitizePublicData);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).flatMap(([key, nested]) => privateKeys.has(key.toLowerCase()) ? [] : [[key, sanitizePublicData(nested)]]));
  return value;
}
