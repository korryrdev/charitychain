import { deepFreeze, env } from './environment.js';

export function createFeatureFlags(environment = env) {
  return deepFreeze({
    mpesa: environment.FEATURE_MPESA_ENABLED,
    bank: environment.FEATURE_BANK_ENABLED,
    sms: environment.FEATURE_SMS_ENABLED,
    ipfs: environment.FEATURE_IPFS_ENABLED,
    blockchainAnchoring: environment.FEATURE_BLOCKCHAIN_ANCHORING_ENABLED,
    backgroundJobs: environment.FEATURE_BACKGROUND_JOBS_ENABLED,
    publicTransparency: environment.FEATURE_PUBLIC_TRANSPARENCY_ENABLED
  });
}

export const featureFlags = createFeatureFlags();
