import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { authorizeAny } from '../../src/middleware/authorize.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { notFound } from '../../src/middleware/notFound.js';
import { createAlertsRouter } from '../../src/modules/alerts/alerts.routes.js';
import { createAuthRouter } from '../../src/modules/auth/auth.routes.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import { createBankRouter } from '../../src/modules/bank/bank.routes.js';
import { verifyBankDepositSchema } from '../../src/modules/bank/bank.validation.js';
import { createCasesRouter } from '../../src/modules/cases/cases.routes.js';
import { createDonorClaimService } from '../../src/modules/donors/donorClaim.service.js';
import { createDonorPortalRouter } from '../../src/modules/donors/donorPortal.routes.js';
import { createItemsRouter } from '../../src/modules/items/items.routes.js';
import { toTrackedDonation } from '../../src/modules/moneyDonations/moneyDonations.mapper.js';
import { transparencyAggregationService } from '../../src/modules/transparency/transparencyAggregation.service.js';
import { computeDonorRef } from '../../src/security/donorReference.js';
import { createHealthRouter } from '../../src/routes/health.routes.js';

function withFakeAuth(permissions = []) {
  return (req, _res, next) => {
    req.auth = { user: { id: 'user-1', email: 'u@example.com' }, roles: [], permissions };
    next();
  };
}

describe('Wave 1 security & API contract hardening', () => {
  it('exposes GET /health root check alongside /ready', async () => {
    const app = express();
    app.use('/health', createHealthRouter({ checks: { database: async () => true } }));
    app.use(errorHandler);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'charitychain-api',
      dependencies: { database: 'ok' }
    });
  });

  it('removes /public/auth/demo-login completely', async () => {
    const app = express();
    app.use(express.json());
    app.use('/public/auth', createAuthRouter());
    app.use(notFound);
    app.use(errorHandler);

    const res = await request(app).post('/public/auth/demo-login').send({ role: 'ADMIN' });
    expect(res.status).toBe(404);
  });

  it('strips raw session tokens and normalizes requiresMfa on login', async () => {
    const service = createAuthService({
      engine: {
        api: {
          signInEmail: vi.fn().mockResolvedValue({
            response: { twoFactorRedirect: true, token: 'secret-raw-token', user: { id: 'u1' } },
            headers: new Headers()
          })
        }
      },
      repository: {
        findUserByEmail: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'chair@example.com',
          name: 'Chair',
          status: 'ACTIVE',
          emailVerified: true,
          twoFactorEnabled: true,
          roles: [
            {
              role: {
                code: 'COMMITTEE_MEMBER',
                permissions: [{ permission: { code: PERMISSIONS.CASE_DECIDE } }]
              }
            }
          ]
        })
      }
    });

    const result = await service.login({ email: 'chair@example.com', password: 'Password123456!' });
    expect(result.response.token).toBeUndefined();
    expect(result.response.requiresMfa).toBe(true);
    expect(result.response.mfaVerified).toBe(false);
    expect(result.response.roles).toEqual(['COMMITTEE_MEMBER']);
  });

  it('enforces authorizeAny and RBAC guards on cases, bank, items, alerts rules, and donor portal', async () => {
    const app = express();
    app.use(express.json());
    app.use('/cases', withFakeAuth([]), createCasesRouter({ listCases: vi.fn(), listSubgroups: vi.fn() }));
    app.use('/bank', withFakeAuth([]), createBankRouter({ service: { listDeposits: vi.fn() } }));
    app.use('/items', withFakeAuth([]), createItemsRouter({ listItems: vi.fn() }));
    app.use('/donor', withFakeAuth([]), createDonorPortalRouter({ getDashboard: vi.fn() }));
    app.use(
      '/alerts',
      withFakeAuth([PERMISSIONS.ALERT_RESOLVE]),
      createAlertsRouter({ updateRule: vi.fn() })
    );
    app.use(
      '/any-test',
      withFakeAuth([PERMISSIONS.BANK_DEPOSIT_CREATE]),
      authorizeAny(PERMISSIONS.BANK_DEPOSIT_CREATE, PERMISSIONS.BANK_DEPOSIT_VERIFY),
      (_req, res) => res.json({ ok: true })
    );
    app.use(errorHandler);

    expect((await request(app).get('/cases')).status).toBe(403);
    expect((await request(app).get('/cases/subgroups')).status).toBe(403);
    expect((await request(app).get('/bank')).status).toBe(403);
    expect((await request(app).get('/items')).status).toBe(403);
    expect((await request(app).get('/donor/dashboard')).status).toBe(403);
    expect((await request(app).patch('/alerts/rules/r1').send({ threshold: 10 })).status).toBe(403);
    expect((await request(app).get('/any-test')).status).toBe(200);
  });

  it('rejects raw donorRef without a signed claim token and supports email/bank donor identity matching', async () => {
    const emailRef = computeDonorRef('donor@example.com', 'email');
    const mockLot = {
      id: 'lot-1',
      receiptCode: 'MLK-REAL-1001',
      donorRef: emailRef,
      totalAmountMinor: 50000n,
      remainingAmountMinor: 50000n,
      currency: 'KES',
      channel: 'MPESA',
      createdAt: new Date(),
      allocations: []
    };
    const claimService = createDonorClaimService({
      secret: 'unit-test-secret-with-32-chars-minimum',
      database: {
        donationLot: {
          findUnique: vi.fn().mockResolvedValue(mockLot),
          findMany: vi.fn().mockResolvedValue([mockLot])
        },
        donorPreferenceEvent: { findFirst: vi.fn().mockResolvedValue(null) },
        donorBadgeAward: { findMany: vi.fn().mockResolvedValue([]) }
      }
    });

    await expect(claimService.getDonorDashboard(emailRef)).rejects.toMatchObject({
      statusCode: 401
    });

    const claimed = await claimService.claimReceipt({
      receiptCode: 'MLK-REAL-1001',
      donorIdentity: 'donor@example.com'
    });
    expect(claimed.token).toBeTypeOf('string');
    const dashboard = await claimService.getDonorDashboard(claimed.token);
    expect(dashboard.donorRef).toBe(emailRef);
  });

  it('preserves bank earmark on verify, createdAt on tracked donations, and REAL_NAME/showRecognitionTier', () => {
    const parsed = verifyBankDepositSchema.parse({ notes: 'Verified ok', earmark: 'FEES' });
    expect(parsed).toEqual({ notes: 'Verified ok', earmark: 'FEES' });

    const now = new Date('2026-11-27T06:00:00.000Z');
    const tracked = toTrackedDonation({
      trackingId: 'MAL-123456789012',
      amount: 1000,
      currency: 'KES',
      purpose: 'TUITION',
      status: 'CONFIRMED',
      createdAt: now,
      confirmedAt: now,
      reconciledAt: null
    });
    expect(tracked.createdAt).toBe(now);

    const board = transparencyAggregationService.dashboard({
      donations: { _sum: { amount: 5000 }, _count: { id: 1 } },
      disbursements: { _sum: { amount: 1000 }, _count: { id: 1 } },
      inventory: [],
      recognition: [
        {
          publicAlias: 'Quiet Owl',
          displayNameMode: 'REAL_NAME',
          showContributionTotal: false,
          showRecognitionTier: false,
          totalContribution: 5000,
          recognitionTier: 'GOLD',
          user: { name: 'Real Donor' }
        }
      ],
      audit: []
    });
    expect(board.recognition).toEqual([{ name: 'Real Donor' }]);
  });
});
