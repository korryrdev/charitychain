'use strict';

import { describe, it, expect, vi } from 'vitest';
import { createBankReconciliationService } from '../../src/modules/bank/bankReconciliation.service.js';
import { BankService } from '../../src/modules/bank/bank.service.js';

describe('G26 & G27: Bank Statement Import, Reconciliation, and Foreign Currency (FR-INT-07, FR-INT-09, R07)', () => {
  it('imports CSV statement lines into minor units and ignores duplicates', async () => {
    const created = [];
    const mockDb = {
      bankStatementLine: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          return created.find((c) => c.reference === where.reference) || null;
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          created.push(data);
          return { id: `line-${created.length}`, ...data };
        })
      }
    };

    const service = createBankReconciliationService({ database: mockDb });
    const csv = `Date,Reference,Amount
2026-11-01,DEP-1001,5000.00
2026-11-02,DEP-1002,12500.50
2026-11-01,DEP-1001,5000.00`;

    const result = await service.importCsv(csv);
    expect(result.importedCount).toBe(2);
    expect(created[0].amountMinor).toBe(500000n);
    expect(created[1].amountMinor).toBe(1250050n);
  });

  it('matches statement lines with ledger deposits and raises R07 on stale unmatched deposits', async () => {
    const mockAlerts = { raiseAlert: vi.fn() };
    const deposits = [
      {
        id: 'dep-1',
        depositReference: 'DEP-1001',
        amountMinor: 500000n,
        status: 'VERIFIED',
        createdAt: new Date('2026-11-01T00:00:00Z')
      },
      {
        id: 'dep-2',
        depositReference: 'DEP-1002',
        amountMinor: 200000n,
        status: 'VERIFIED',
        createdAt: new Date(Date.now() - 10 * 86400000)
      }
    ];

    const lines = [
      {
        id: 'line-1',
        reference: 'DEP-1001',
        amountMinor: 500000n,
        isMatched: false,
        statementDate: new Date('2026-11-01')
      }
    ];

    const mockDb = {
      bankStatementLine: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          if (where.isMatched === false) {
            return lines.filter((l) => !l.isMatched);
          }
          return lines;
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          const l = lines.find((item) => item.id === where.id);
          Object.assign(l, data);
          return l;
        })
      },
      bankDeposit: {
        findMany: vi.fn().mockResolvedValue(deposits)
      }
    };

    const service = createBankReconciliationService({ database: mockDb, alerts: mockAlerts });
    const recon = await service.reconcile({ windowDays: 7 });

    expect(recon.matchedCount).toBe(1);
    expect(recon.unmatchedDepositCount).toBe(1);
    expect(mockAlerts.raiseAlert).toHaveBeenCalledWith(
      expect.objectContaining({ ruleId: 'R07', severity: 'HIGH' })
    );
  });
});
