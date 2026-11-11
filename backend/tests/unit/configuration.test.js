import { describe, expect, it } from 'vitest';
import { createAuthenticationConfig } from '../../src/config/authentication.js';
import { createBlockchainConfig } from '../../src/config/blockchain.js';
import { createCorsConfig } from '../../src/config/cors.js';
import { createDatabaseConfig } from '../../src/config/database.js';
import { parseEnvironment } from '../../src/config/environment.js';
import { createFeatureFlags } from '../../src/config/featureFlags.js';
import { createIntegrationsConfig } from '../../src/config/integrations.js';
import { createLoggingConfig } from '../../src/config/logging.js';
import { createSecurityConfig } from '../../src/config/security.js';

const baseEnvironment = {
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
  SESSION_SECRET: 's'.repeat(32),
  ENCRYPTION_KEY: 'e'.repeat(32)
};

describe('backend configuration', () => {
  it('parses defaults and coerces environment values', () => {
    const environment = parseEnvironment({
      ...baseEnvironment,
      PORT: '3100',
      TRUST_PROXY: 'true',
      FEATURE_IPFS_ENABLED: 'false'
    });

    expect(environment.PORT).toBe(3100);
    expect(environment.TRUST_PROXY).toBe(true);
    expect(environment.FEATURE_IPFS_ENABLED).toBe(false);
    expect(Object.isFrozen(environment)).toBe(true);
  });

  it('rejects inconsistent pool limits and incomplete enabled integrations', () => {
    expect(() =>
      parseEnvironment({ ...baseEnvironment, DATABASE_POOL_MIN: '11', DATABASE_POOL_MAX: '10' })
    ).toThrow('DATABASE_POOL_MIN cannot exceed DATABASE_POOL_MAX');

    expect(() => parseEnvironment({ ...baseEnvironment, FEATURE_MPESA_ENABLED: 'true' })).toThrow(
      'MPESA_CONSUMER_KEY is required when M-Pesa is enabled'
    );
  });

  it('fails closed for insecure production URLs and placeholder secrets', () => {
    expect(() =>
      parseEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
        SESSION_SECRET: 'replace-this-session-secret-value',
        ENCRYPTION_KEY: 'change-this-encryption-key-value'
      })
    ).toThrow('APP_URL must use HTTPS in production');
  });

  it('builds immutable configuration for every configuration area', () => {
    const environment = parseEnvironment({
      ...baseEnvironment,
      CORS_ALLOWED_ORIGINS: 'https://one.example, https://two.example,https://one.example'
    });
    const configurations = [
      createAuthenticationConfig(environment),
      createBlockchainConfig(environment),
      createCorsConfig(environment),
      createDatabaseConfig(environment),
      createFeatureFlags(environment),
      createIntegrationsConfig(environment),
      createLoggingConfig(environment),
      createSecurityConfig(environment)
    ];

    for (const configuration of configurations) expect(Object.isFrozen(configuration)).toBe(true);
    expect(createCorsConfig(environment).allowedOrigins).toEqual([
      'https://one.example',
      'https://two.example'
    ]);
    expect(Object.isFrozen(createAuthenticationConfig(environment).session.cookie)).toBe(true);
  });

  it('keeps real-provider features disabled under safe development defaults', () => {
    const environment = parseEnvironment(baseEnvironment);
    expect(createFeatureFlags(environment)).toMatchObject({
      mpesa: false,
      bank: false,
      sms: false,
      blockchainAnchoring: false,
      ipfs: true,
      publicTransparency: true
    });
  });
});
