export const INTEGRATION_NAMES = Object.freeze({
  MPESA: 'MPESA',
  BANK: 'BANK',
  SMS: 'SMS',
  IPFS: 'IPFS',
  BLOCKCHAIN: 'BLOCKCHAIN',
  CHAINLINK: 'CHAINLINK',
  UNIVERSITY_DIRECTORY: 'UNIVERSITY_DIRECTORY'
});

export const INTEGRATION_NAME_VALUES = Object.freeze(Object.values(INTEGRATION_NAMES));

export function isIntegrationName(value) {
  return INTEGRATION_NAME_VALUES.includes(value);
}
