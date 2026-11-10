import { describe, expect, it, vi } from 'vitest';
import { INTEGRATION_NAMES, isIntegrationName } from '../../src/constants/integrationNames.js';
import { PERMISSIONS, isPermission } from '../../src/constants/permissions.js';
import { ROLES, isRole } from '../../src/constants/roles.js';
import { STATUSES, isStatus } from '../../src/constants/statuses.js';
import { AppError } from '../../src/errors/AppError.js';
import { AuthenticationError } from '../../src/errors/AuthenticationError.js';
import { AuthorizationError } from '../../src/errors/AuthorizationError.js';
import { ConflictError } from '../../src/errors/ConflictError.js';
import { ERROR_CODES, isErrorCode } from '../../src/errors/errorCodes.js';
import { IntegrationError } from '../../src/errors/IntegrationError.js';
import { ValidationError } from '../../src/errors/ValidationError.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { logger } from '../../src/observability/logger.js';

describe('backend constants', () => {
  it('provides immutable and unique role, permission, integration, and error-code catalogs', () => {
    const catalogs = [ROLES, PERMISSIONS, INTEGRATION_NAMES, ERROR_CODES];
    for (const catalog of catalogs) {
      expect(Object.isFrozen(catalog)).toBe(true);
      expect(new Set(Object.values(catalog)).size).toBe(Object.values(catalog).length);
    }
  });

  it('recognizes known constants and rejects unknown values', () => {
    expect(isRole(ROLES.COMMITTEE_MEMBER)).toBe(true);
    expect(isRole('OWNER')).toBe(false);
    expect(isPermission(PERMISSIONS.APPLICATION_APPROVE)).toBe(true);
    expect(isPermission('application:delete')).toBe(false);
    expect(isIntegrationName(INTEGRATION_NAMES.MPESA)).toBe(true);
    expect(isIntegrationName('CRYPTO_WALLET')).toBe(false);
    expect(isErrorCode(ERROR_CODES.VALIDATION_FAILED)).toBe(true);
  });

  it('keeps every status group immutable and validates status membership by group', () => {
    expect(Object.isFrozen(STATUSES)).toBe(true);
    for (const group of Object.values(STATUSES)) expect(Object.isFrozen(group)).toBe(true);
    expect(isStatus('APPLICATION', STATUSES.APPLICATION.APPROVED)).toBe(true);
    expect(isStatus('APPLICATION', STATUSES.DONATION.CONFIRMED)).toBe(false);
    expect(isStatus('UNKNOWN', 'APPROVED')).toBe(false);
  });
});

describe('backend errors', () => {
  it('maps specialized errors to stable HTTP status codes and error codes', () => {
    expect(new AuthenticationError()).toMatchObject({
      statusCode: 401,
      code: ERROR_CODES.AUTHENTICATION_REQUIRED
    });
    expect(new AuthorizationError()).toMatchObject({
      statusCode: 403,
      code: ERROR_CODES.FORBIDDEN
    });
    expect(new ConflictError()).toMatchObject({ statusCode: 409, code: ERROR_CODES.CONFLICT });
    expect(new ValidationError('Invalid amount', { amount: 'Must be positive' })).toMatchObject({
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_FAILED,
      details: { amount: 'Must be positive' }
    });
  });

  it('does not expose integration failure messages or causes by default', () => {
    const cause = new Error('provider returned secret diagnostics');
    const error = new IntegrationError('MPESA', 'Raw provider failure', { cause });

    expect(error).toMatchObject({ statusCode: 502, retryable: true, expose: false });
    expect(error.toResponse('request-1')).toEqual({
      code: ERROR_CODES.INTEGRATION_UNAVAILABLE,
      message: 'The request could not be completed.',
      requestId: 'request-1'
    });
    expect(error.cause).toBe(cause);
  });

  it('serializes exposed operational errors with safe details and request correlation', () => {
    const error = new AppError({
      message: 'Duplicate request',
      code: ERROR_CODES.IDEMPOTENCY_CONFLICT,
      statusCode: 409,
      details: { field: 'idempotencyKey' }
    });
    expect(error.toResponse('request-2')).toEqual({
      code: ERROR_CODES.IDEMPOTENCY_CONFLICT,
      message: 'Duplicate request',
      details: { field: 'idempotencyKey' },
      requestId: 'request-2'
    });
  });

  it('returns a generic response for unknown programming errors', () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    errorHandler(new Error('database password leaked'), { id: 'request-3' }, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'The request could not be completed.',
        requestId: 'request-3'
      }
    });
    loggerSpy.mockRestore();
  });
});
