import { deepFreeze, env } from './environment.js';

export function createBlockchainConfig(environment = env) {
  return deepFreeze({
    enabled: environment.FEATURE_BLOCKCHAIN_ANCHORING_ENABLED,
    network: environment.BLOCKCHAIN_NETWORK,
    rpcUrl: environment.POLYGON_RPC_URL ?? null,
    servicePrivateKey: environment.BLOCKCHAIN_SERVICE_PRIVATE_KEY ?? null,
    auditContractAddress: environment.BLOCKCHAIN_AUDIT_CONTRACT_ADDRESS ?? null,
    confirmations: environment.BLOCKCHAIN_CONFIRMATIONS
  });
}

export const blockchainConfig = createBlockchainConfig();
