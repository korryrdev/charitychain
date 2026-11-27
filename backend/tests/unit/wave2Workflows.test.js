import express from 'express';
import request from 'supertest';
import Web3 from 'web3';
import { signMessageWithPrivateKey } from 'web3-eth-accounts';
import { describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { createAlertsRouter } from '../../src/modules/alerts/alerts.routes.js';
import { DEFAULT_FORENSIC_RULES } from '../../src/modules/alerts/alerts.service.js';
import { createBankRouter } from '../../src/modules/bank/bank.routes.js';
import { createCasesRouter } from '../../src/modules/cases/cases.routes.js';
import { computeReleaseAuthDigest, recoverReleaseSigner } from '../../src/modules/cases/cases.service.js';
import { authorizeReleaseSchema } from '../../src/modules/cases/cases.validation.js';
import { createReportsRouter } from '../../src/modules/reports/reports.routes.js';
import { renderQuarterlyReportPdf } from '../../src/modules/reports/reportPdf.service.js';

function withFakeAuth(permissions = []) {
  return (req, _res, next) => {
    req.auth = { user: { id: 'user-wave2', email: 'wave2@charitychain.org' }, roles: [], permissions };
    next();
  };
}

describe('Wave 2 real workflows: EIP-712, IPFS evidence, PDF reports, Benford/rules & bank CSV', () => {
  it('verifies real EIP-712 signatures with recoverReleaseSigner and rejects DEMO_SIGNATORY in schema', () => {
    const web3 = new Web3();
    const acct1 = web3.eth.accounts.create();
    const acct2 = web3.eth.accounts.create();
    const caseId = '11111111-1111-4111-8111-111111111111';
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const digest = computeReleaseAuthDigest({
      caseId,
      amountMinor: 450000n,
      nonce: 0,
      deadline,
      chainId: 80002,
      verifyingContract: '0x0000000000000000000000000000000000000001',
    });

    const sig1 = signMessageWithPrivateKey(digest, acct1.privateKey).signature;
    const recovered1 = recoverReleaseSigner(digest, sig1);
    expect(recovered1.toLowerCase()).toBe(acct1.address.toLowerCase());
    expect(recovered1.toLowerCase()).not.toBe(acct2.address.toLowerCase());

    expect(() =>
      authorizeReleaseSchema.parse({
        signer: acct1.address,
        signature: sig1,
        signMethod: 'DEMO_SIGNATORY',
      })
    ).toThrow();

    expect(
      authorizeReleaseSchema.parse({
        signer: acct1.address,
        signature: sig1,
        chainId: 80002,
        verifyingContract: '0x0000000000000000000000000000000000000001',
        signMethod: 'METAMASK_EIP712',
      }).signMethod
    ).toBe('METAMASK_EIP712');
  });

  it('uploads encrypted case evidence via POST /cases/:id/evidence with DISBURSEMENT_CREATE permission', async () => {
    const uploadEvidence = vi.fn().mockResolvedValue({
      evidenceCid: 'bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
      evidenceHash: '0x' + 'aa'.repeat(32),
      size: 512,
      pinnedAt: '2026-11-27T09:00:00.000Z',
    });

    const app = express();
    app.use(express.json());
    app.use('/cases', withFakeAuth([PERMISSIONS.DISBURSEMENT_CREATE]), createCasesRouter({ uploadEvidence }));
    app.use(errorHandler);

    const res = await request(app).post('/cases/case-uuid-1/evidence').send({
      filename: 'receipt.pdf',
      mimeType: 'application/pdf',
      base64Content: 'JVBERi0xLjQ=',
      notes: 'M-Pesa receipt confirmation',
    });

    expect(res.status).toBe(201);
    expect(res.body.evidenceCid).toMatch(/^bafk/);
    expect(uploadEvidence).toHaveBeenCalledWith(
      'case-uuid-1',
      expect.objectContaining({ filename: 'receipt.pdf', mimeType: 'application/pdf' }),
      'user-wave2'
    );
  });

  it('renders and serves a valid %PDF-1.4 quarterly report binary at GET /reports/:id/pdf', async () => {
    const mockReport = {
      id: 'rep-1',
      year: 2026,
      quarter: 4,
      version: 2,
      reportHash: '0x' + 'ab'.repeat(32),
      periodRoot: '0x' + 'cd'.repeat(32),
      createdAt: new Date('2026-11-27T09:00:00.000Z'),
      canonicalJson: {
        academicYear: '2026/2027',
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.999Z',
        totalInflowMinor: '500000',
        totalDisbursedMinor: '300000',
        donationLotsCount: 1,
        disbursementsCount: 1,
        lots: [{ code: 'MLK-TEST-1111', channel: 'BANK', amount: '500000' }],
        disbursements: [{ caseNumber: 'C-0001', category: 'FEES', amount: '300000' }],
      },
    };

    const pdf = renderQuarterlyReportPdf(mockReport);
    expect(pdf.subarray(0, 8).toString('utf8')).toBe('%PDF-1.4');
    expect(pdf.toString('utf8')).toContain('CHARITYCHAIN QUARTERLY AUDIT REPORT');
    expect(pdf.toString('utf8')).toContain('%%EOF');

    const app = express();
    app.use(
      '/reports',
      createReportsRouter({
        getReport: vi.fn().mockResolvedValue(mockReport),
      })
    );
    app.use(errorHandler);

    const res = await request(app).get('/reports/rep-1/pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('charitychain-report-2026-Q4-v2.pdf');
    expect(Buffer.from(res.body).subarray(0, 8).toString('utf8')).toBe('%PDF-1.4');
  });

  it('serves GET /alerts/benford and GET/PATCH /alerts/rules without route collision on /:id', async () => {
    const getBenfordAnalysis = vi.fn().mockResolvedValue({
      disbursements: { isAnomalous: false, sampleSize: 5, chiSquare: 0 },
      donations: { isAnomalous: false, sampleSize: 8, chiSquare: 0 },
      combined: { isAnomalous: false, sampleSize: 13, chiSquare: 0 },
      criticalValue: 15.51,
      expectedDistribution: [],
    });
    const getAlert = vi.fn();
    const listRules = vi.fn().mockResolvedValue(DEFAULT_FORENSIC_RULES);
    const updateRule = vi.fn().mockResolvedValue({ ...DEFAULT_FORENSIC_RULES[0], isEnabled: false });

    const app = express();
    app.use(express.json());
    app.use(
      '/alerts',
      withFakeAuth([PERMISSIONS.ALERT_READ, PERMISSIONS.RULES_MANAGE]),
      createAlertsRouter({ getBenfordAnalysis, getAlert, listRules, updateRule })
    );
    app.use(errorHandler);

    const benfordRes = await request(app).get('/alerts/benford');
    expect(benfordRes.status).toBe(200);
    expect(benfordRes.body.criticalValue).toBe(15.51);
    expect(getAlert).not.toHaveBeenCalled();

    const rulesRes = await request(app).get('/alerts/rules');
    expect(rulesRes.status).toBe(200);
    expect(rulesRes.body.items.length).toBeGreaterThanOrEqual(8);

    const patchRes = await request(app)
      .patch('/alerts/rules/R01')
      .send({ isEnabled: false, thresholdParams: { requireEvidenceCid: false } });
    expect(patchRes.status).toBe(200);
    expect(updateRule).toHaveBeenCalledWith('R01', {
      isEnabled: false,
      thresholdParams: { requireEvidenceCid: false },
    });
  });

  it('imports CSV statements and runs 2-way bank reconciliation via /donations/bank endpoints', async () => {
    const importCsv = vi.fn().mockResolvedValue({ importedCount: 2, lines: [{ id: 'l1' }, { id: 'l2' }] });
    const reconcile = vi.fn().mockResolvedValue({
      matchedCount: 1,
      unmatchedStatementCount: 1,
      unmatchedDepositCount: 0,
      matched: [{ statementLineId: 'l1', depositId: 'd1' }],
      unmatchedStatementLines: [],
      unmatchedLedgerDeposits: [],
    });

    const app = express();
    app.use(express.json());
    app.use(
      '/bank',
      withFakeAuth([PERMISSIONS.BANK_DEPOSIT_CREATE, PERMISSIONS.BANK_DEPOSIT_VERIFY]),
      createBankRouter({ service: {}, reconService: { importCsv, reconcile } })
    );
    app.use(errorHandler);

    const importRes = await request(app)
      .post('/bank/statements/import')
      .send({ csv: 'Date,Reference,Amount\n2026-11-27,WIRE-1,5000.00' });
    expect(importRes.status).toBe(201);
    expect(importRes.body.importedCount).toBe(2);

    const reconRes = await request(app).get('/bank/reconciliation?windowDays=14');
    expect(reconRes.status).toBe(200);
    expect(reconcile).toHaveBeenCalledWith({ windowDays: 14 });
    expect(reconRes.body.matchedCount).toBe(1);
  });
});
