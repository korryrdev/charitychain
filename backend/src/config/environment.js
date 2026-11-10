import { config } from 'dotenv';
import { z } from 'zod';

config({ path: new URL('../../../.env', import.meta.url), quiet: true });

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional()
);
const booleanValue = z.preprocess(
  (value) => (typeof value === 'string' ? value.toLowerCase() : value),
  z
    .union([z.literal(true), z.literal(false), z.literal('true'), z.literal('false')])
    .transform((value) => value === true || value === 'true')
);

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_NAME: z.string().min(1).default('CharityChain'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    APP_URL: z.url().default('http://localhost:5173'),
    API_URL: z.url().default('http://localhost:3000'),
    TRUST_PROXY: booleanValue.default(false),
    DATABASE_URL: z.string().startsWith('postgresql://'),
    DATABASE_POOL_MIN: z.coerce.number().int().min(0).default(2),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    SESSION_SECRET: z.string().min(32),
    SESSION_COOKIE_NAME: z.string().min(1).default('charitychain_session'),
    SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(480),
    SESSION_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(30),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(15),
    ACCOUNT_VERIFICATION_TTL_MINUTES: z.coerce.number().int().positive().default(30),
    CONFIRMATION_TTL_MINUTES: z.coerce.number().int().positive().default(15),
    MFA_ISSUER: z.string().min(1).default('CharityChain'),
    MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
    ACCOUNT_LOCK_MINUTES: z.coerce.number().int().positive().default(15),
    ENCRYPTION_KEY: z.string().min(32),
    CORS_ALLOWED_ORIGINS: optionalString,
    JSON_BODY_LIMIT: z.string().min(1).default('1mb'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    LOG_PRETTY: booleanValue.default(false),
    MPESA_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
    MPESA_CONSUMER_KEY: optionalString,
    MPESA_CONSUMER_SECRET: optionalString,
    MPESA_SHORTCODE: optionalString,
    MPESA_PASSKEY: optionalString,
    MPESA_INITIATOR_NAME: optionalString,
    MPESA_SECURITY_CREDENTIAL: optionalString,
    MPESA_CALLBACK_SECRET: optionalString,
    MPESA_UNIVERSITY_SHORTCODE: optionalString,
    MPESA_UNIVERSITY_ACCOUNT: optionalString,
    MPESA_CALLBACK_BASE_URL: optionalString,
    BANK_PROVIDER: z.enum(['sandbox', 'pesapal', 'flutterwave']).default('sandbox'),
    BANK_API_KEY: optionalString,
    BANK_WEBHOOK_SECRET: optionalString,
    SMS_PROVIDER: z.enum(['sandbox', 'africas_talking']).default('sandbox'),
    SMS_API_KEY: optionalString,
    SMS_USERNAME: optionalString,
    SMS_SENDER_ID: optionalString,
    IPFS_API_URL: z.url().default('http://localhost:5001'),
    IPFS_GATEWAY_URL: z.url().default('http://localhost:8080'),
    BLOCKCHAIN_NETWORK: z.enum(['localhost', 'polygon_amoy', 'polygon']).default('localhost'),
    POLYGON_RPC_URL: optionalString,
    BLOCKCHAIN_SERVICE_PRIVATE_KEY: optionalString,
    BLOCKCHAIN_AUDIT_CONTRACT_ADDRESS: optionalString,
    BLOCKCHAIN_CONFIRMATIONS: z.coerce.number().int().positive().default(2),
    FEATURE_MPESA_ENABLED: booleanValue.default(false),
    FEATURE_BANK_ENABLED: booleanValue.default(false),
    FEATURE_SMS_ENABLED: booleanValue.default(false),
    FEATURE_IPFS_ENABLED: booleanValue.default(true),
    FEATURE_BLOCKCHAIN_ANCHORING_ENABLED: booleanValue.default(false),
    FEATURE_BACKGROUND_JOBS_ENABLED: booleanValue.default(false),
    FEATURE_PUBLIC_TRANSPARENCY_ENABLED: booleanValue.default(true),
    FEATURE_CHAINLINK_ENABLED: booleanValue.default(false),
    CHAINLINK_ORACLE_URL: optionalString,
    CHAINLINK_WEBHOOK_SECRET: optionalString
  })
  .superRefine((value, context) => {
    if (value.DATABASE_POOL_MIN > value.DATABASE_POOL_MAX) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_POOL_MIN'],
        message: 'DATABASE_POOL_MIN cannot exceed DATABASE_POOL_MAX.'
      });
    }

    const requireValues = (enabled, keys, reason) => {
      if (!enabled) return;
      for (const key of keys) {
        if (!value[key]) {
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} is required ${reason}.`
          });
        }
      }
    };

    requireValues(
      value.FEATURE_MPESA_ENABLED,
      ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY', 'MPESA_INITIATOR_NAME', 'MPESA_SECURITY_CREDENTIAL', 'MPESA_CALLBACK_SECRET', 'MPESA_UNIVERSITY_SHORTCODE', 'MPESA_UNIVERSITY_ACCOUNT'],
      'when M-Pesa is enabled'
    );
    requireValues(
      value.FEATURE_BANK_ENABLED && value.BANK_PROVIDER !== 'sandbox',
      ['BANK_API_KEY', 'BANK_WEBHOOK_SECRET'],
      'for the selected bank provider'
    );
    requireValues(
      value.FEATURE_SMS_ENABLED && value.SMS_PROVIDER !== 'sandbox',
      ['SMS_API_KEY', 'SMS_USERNAME'],
      'for the selected SMS provider'
    );
    requireValues(
      value.FEATURE_BLOCKCHAIN_ANCHORING_ENABLED,
      ['POLYGON_RPC_URL', 'BLOCKCHAIN_SERVICE_PRIVATE_KEY', 'BLOCKCHAIN_AUDIT_CONTRACT_ADDRESS'],
      'when blockchain anchoring is enabled'
    );
    requireValues(value.FEATURE_CHAINLINK_ENABLED, ['CHAINLINK_ORACLE_URL', 'CHAINLINK_WEBHOOK_SECRET'], 'when Chainlink is enabled');

    if (value.NODE_ENV === 'production') {
      for (const key of ['APP_URL', 'API_URL']) {
        if (!value[key].startsWith('https://')) {
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} must use HTTPS in production.`
          });
        }
      }
      for (const key of ['SESSION_SECRET', 'ENCRYPTION_KEY']) {
        if (/replace|change|local|password/i.test(value[key])) {
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} contains a placeholder value.`
          });
        }
      }
    }
  });

export function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nestedValue of Object.values(value)) deepFreeze(nestedValue);
  return Object.freeze(value);
}

export function parseEnvironment(input) {
  const parsed = environmentSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return deepFreeze(parsed.data);
}

export { environmentSchema };
export const env = parseEnvironment(process.env);
