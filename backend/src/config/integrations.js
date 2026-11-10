import { deepFreeze, env } from './environment.js';

export function createIntegrationsConfig(environment = env) {
  return deepFreeze({
    mpesa: {
      enabled: environment.FEATURE_MPESA_ENABLED,
      environment: environment.MPESA_ENVIRONMENT,
      consumerKey: environment.MPESA_CONSUMER_KEY ?? null,
      consumerSecret: environment.MPESA_CONSUMER_SECRET ?? null,
      shortcode: environment.MPESA_SHORTCODE ?? null,
      passkey: environment.MPESA_PASSKEY ?? null,
      initiatorName: environment.MPESA_INITIATOR_NAME ?? null,
      securityCredential: environment.MPESA_SECURITY_CREDENTIAL ?? null,
      callbackSecret: environment.MPESA_CALLBACK_SECRET ?? null,
      universityShortcode: environment.MPESA_UNIVERSITY_SHORTCODE ?? null,
      universityAccount: environment.MPESA_UNIVERSITY_ACCOUNT ?? null,
      callbackBaseUrl: environment.MPESA_CALLBACK_BASE_URL ?? environment.API_URL
    },
    bank: {
      enabled: environment.FEATURE_BANK_ENABLED,
      provider: environment.BANK_PROVIDER,
      apiKey: environment.BANK_API_KEY ?? null,
      webhookSecret: environment.BANK_WEBHOOK_SECRET ?? null
    },
    sms: {
      enabled: environment.FEATURE_SMS_ENABLED,
      provider: environment.SMS_PROVIDER,
      apiKey: environment.SMS_API_KEY ?? null,
      username: environment.SMS_USERNAME ?? null,
      senderId: environment.SMS_SENDER_ID ?? null
    },
    ipfs: {
      enabled: environment.FEATURE_IPFS_ENABLED,
      apiUrl: environment.IPFS_API_URL,
      gatewayUrl: environment.IPFS_GATEWAY_URL
    },
    chainlink: {
      enabled: environment.FEATURE_CHAINLINK_ENABLED,
      oracleUrl: environment.CHAINLINK_ORACLE_URL ?? null,
      webhookSecret: environment.CHAINLINK_WEBHOOK_SECRET ?? null
    }
  });
}

export const integrationsConfig = createIntegrationsConfig();
