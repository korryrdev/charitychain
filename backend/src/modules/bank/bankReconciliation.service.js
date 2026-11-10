'use strict';

import { prisma } from '@charitychain/database';
import { toMinorUnits } from '../../utils/money.js';
import { alertsService } from '../alerts/alerts.service.js';

export function createBankReconciliationService({ database = prisma, alerts = alertsService } = {}) {
  return {
    async importCsv(csvContent) {
      if (!csvContent || typeof csvContent !== 'string') {
        throw new TypeError('CSV content must be a non-empty string.');
      }

      const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        return { importedCount: 0, lines: [] };
      }

      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const dateIdx = header.findIndex((h) => h.includes('date'));
      const refIdx = header.findIndex((h) => h.includes('ref') || h.includes('desc'));
      const amountIdx = header.findIndex((h) => h.includes('amount') || h.includes('value'));

      if (dateIdx === -1 || refIdx === -1 || amountIdx === -1) {
        throw new Error('CSV must contain Date, Reference, and Amount columns.');
      }

      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length <= Math.max(dateIdx, refIdx, amountIdx)) continue;

        const dateStr = cols[dateIdx];
        const refStr = cols[refIdx];
        const amountStr = cols[amountIdx];

        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) continue;

        const numAmount = parseFloat(amountStr);
        if (isNaN(numAmount) || numAmount <= 0) continue;

        const amountMinor = toMinorUnits(numAmount);

        const existing = await database.bankStatementLine.findFirst({
          where: { reference: refStr, amountMinor }
        });

        if (!existing) {
          const line = await database.bankStatementLine.create({
            data: {
              statementDate: date,
              reference: refStr,
              amountMinor
            }
          });
          imported.push(line);
        }
      }

      return { importedCount: imported.length, lines: imported };
    },

    async reconcile({ windowDays = 7 } = {}) {
      const unmatchedLines = await database.bankStatementLine.findMany({
        where: { isMatched: false }
      });

      const deposits = await database.bankDeposit.findMany({
        where: { status: 'VERIFIED' }
      });

      const matched = [];
      const matchedDepositIds = new Set();

      for (const line of unmatchedLines) {
        const match = deposits.find(
          (d) =>
            !matchedDepositIds.has(d.id) &&
            (d.depositReference.toLowerCase() === line.reference.toLowerCase() ||
              line.reference.toLowerCase().includes(d.depositReference.toLowerCase())) &&
            d.amountMinor === line.amountMinor
        );

        if (match) {
          await database.bankStatementLine.update({
            where: { id: line.id },
            data: { isMatched: true, matchedDepositId: match.id }
          });
          matchedDepositIds.add(match.id);
          matched.push({ statementLineId: line.id, depositId: match.id });
        }
      }

      const remainingUnmatchedLines = await database.bankStatementLine.findMany({
        where: { isMatched: false }
      });

      const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
      const staleUnmatchedDeposits = deposits.filter(
        (d) => !matchedDepositIds.has(d.id) && new Date(d.createdAt) < cutoff
      );

      if (staleUnmatchedDeposits.length > 0) {
        for (const dep of staleUnmatchedDeposits) {
          await alerts.raiseAlert({
            ruleId: 'R07',
            severity: 'HIGH',
            details: {
              depositId: dep.id,
              reference: dep.depositReference,
              amountMinor: dep.amountMinor.toString(),
              ageDays: Math.floor((Date.now() - new Date(dep.createdAt).getTime()) / 86400000)
            }
          });
        }
      }

      return {
        matchedCount: matched.length,
        unmatchedStatementCount: remainingUnmatchedLines.length,
        unmatchedDepositCount: staleUnmatchedDeposits.length,
        matched,
        unmatchedStatementLines: remainingUnmatchedLines.map((l) => ({
          id: l.id,
          reference: l.reference,
          amountMinor: l.amountMinor.toString(),
          statementDate: l.statementDate
        })),
        unmatchedLedgerDeposits: staleUnmatchedDeposits.map((d) => ({
          id: d.id,
          reference: d.depositReference,
          amountMinor: d.amountMinor.toString(),
          createdAt: d.createdAt
        }))
      };
    }
  };
}

export const bankReconciliationService = createBankReconciliationService();

