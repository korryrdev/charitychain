import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/Money';
import { StatusChip } from '@/components/StatusChip';
import { useAuth } from '@/app/auth/AuthContext';
import { api } from '@/lib/api';
import { Coins, Loader2, Upload, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { BankDeposit, BankReconciliationReport, NeedCategory } from '@/types';

const NEED_CATEGORIES: NeedCategory[] = ['FEES', 'UPKEEP', 'MEDICAL', 'EMERGENCY', 'BOOKS'];

export const DonationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bankRef, setBankRef] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [currency, setCurrency] = useState<'KES' | 'USD' | 'EUR' | 'GBP'>('KES');
  const [fxRate, setFxRate] = useState('');
  const [donorIdentity, setDonorIdentity] = useState('');
  const [verifyEarmark, setVerifyEarmark] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(
    null
  );

  const [csvContent, setCsvContent] = useState('');
  const [windowDays, setWindowDays] = useState('7');
  const [reconReport, setReconReport] = useState<BankReconciliationReport | null>(null);

  const { data: deposits = [], isLoading } = useQuery<BankDeposit[]>({
    queryKey: ['bank-deposits'],
    queryFn: () => api.getBankDeposits(),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      depositReference: string;
      donorIdentity: string;
      amount: number;
      currency: string;
      fxRate?: number;
    }) => api.createBankDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-deposits'] });
      setBankRef('');
      setAmountMajor('');
      setFxRate('');
      setDonorIdentity('');
      setActionMessage({ type: 'ok', text: 'Bank deposit logged pending second-person verification.' });
    },
    onError: (err: unknown) => {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to record deposit.',
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, earmark }: { id: string; earmark?: NeedCategory }) =>
      api.verifyBankDeposit(id, earmark),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-deposits'] });
      setActionMessage({ type: 'ok', text: 'Bank deposit verified and donation lot anchored.' });
    },
    onError: (err: unknown) => {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Verification failed.',
      });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: (csv: string) => api.importBankStatementCsv(csv),
    onSuccess: (res) => {
      setActionMessage({
        type: 'ok',
        text: `Imported ${res.importedCount} new bank statement line(s) for reconciliation.`,
      });
    },
    onError: (err: unknown) => {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Bank statement CSV import failed.',
      });
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: (days: number) => api.reconcileBankStatements(days),
    onSuccess: (report) => {
      setReconReport(report);
      setActionMessage({
        type: 'ok',
        text: `2-way bank reconciliation complete: ${report.matchedCount} matched, ${report.unmatchedStatementCount} unmatched statement line(s).`,
      });
    },
    onError: (err: unknown) => {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '2-way bank reconciliation failed.',
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountMajor || !bankRef) return;
    if (currency !== 'KES' && (!fxRate || Number(fxRate) <= 0)) {
      setActionMessage({
        type: 'error',
        text: 'Enter a positive FX rate to convert non-KES bank deposits into KES minor units.',
      });
      return;
    }
    createMutation.mutate({
      depositReference: bankRef.trim().toUpperCase(),
      donorIdentity: donorIdentity.trim() || 'Anonymous Bank Donor',
      amount: parseFloat(amountMajor),
      currency,
      ...(currency !== 'KES' && fxRate ? { fxRate: parseFloat(fxRate) } : {}),
    });
  };

  const handleVerify = (id: string, enteredBy: string) => {
    if (enteredBy === user?.id || enteredBy === user?.email) {
      setActionMessage({
        type: 'error',
        text: 'Maker-Checker violation: you cannot verify a bank deposit you entered.',
      });
      return;
    }
    verifyMutation.mutate({
      id,
      earmark: verifyEarmark ? (verifyEarmark as NeedCategory) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <Coins className="w-6 h-6 text-emerald-600" />
          Bank deposits, CSV statement import &amp; 2-way reconciliation
        </h1>
      </div>

      {actionMessage && (
        <div
          role={actionMessage.type === 'error' ? 'alert' : 'status'}
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            actionMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {actionMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold">Log bank deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Bank Statement Wire Reference"
                placeholder="e.g. WIRE-892100"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                required
              />
              <Input
                label="Donor Identity / Email"
                placeholder="e.g. donor@example.com"
                value={donorIdentity}
                onChange={(e) => setDonorIdentity(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'KES' | 'USD' | 'EUR' | 'GBP')}
                    className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs font-medium"
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <Input
                  label={`Amount (${currency})`}
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 50000"
                  value={amountMajor}
                  onChange={(e) => setAmountMajor(e.target.value)}
                  required
                />
              </div>
              {currency !== 'KES' && (
                <Input
                  label={`FX Rate (${currency} -> KES)`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 129.50"
                  value={fxRate}
                  onChange={(e) => setFxRate(e.target.value)}
                  required
                />
              )}
              <Button
                type="submit"
                variant="emerald"
                className="w-full"
                isLoading={createMutation.isPending}
              >
                Submit for Second Verification
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold">Deposits verification queue</CardTitle>
              <CardDescription>
                Segregation of duties enforced: Maker cannot verify their own entry.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">Earmark on verify:</span>
              <select
                value={verifyEarmark}
                onChange={(e) => setVerifyEarmark(e.target.value)}
                className="h-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs"
              >
                <option value="">Unrestricted Pool</option>
                {NEED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading deposits...</span>
              </div>
            ) : deposits.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No bank deposits recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {deposits.map((d) => {
                  const isMaker =
                    d.enteredByUserId === user?.id || d.enteredByUserId === user?.email;
                  return (
                    <div
                      key={d.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {d.depositReference}
                          </span>
                          <StatusChip status={d.status === 'VERIFIED' ? 'POOLED' : 'UNDER_REVIEW'} />
                          <span className="text-[11px] font-mono text-zinc-500">{d.currency}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 space-x-2">
                          <span>
                            Entered by:{' '}
                            <strong className="text-zinc-700 dark:text-zinc-300">
                              {d.enteredByUserId}
                            </strong>
                          </span>
                          {d.verifiedByUserId && (
                            <span>
                              &bull; Verified by:{' '}
                              <strong className="text-emerald-600">{d.verifiedByUserId}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Money amountMinor={d.amountMinor} className="text-lg font-bold" />
                        {d.status === 'PENDING_VERIFICATION' && (
                          <Button
                            size="sm"
                            variant={isMaker ? 'outline' : 'emerald'}
                            onClick={() => handleVerify(d.id, d.enteredByUserId)}
                            disabled={isMaker || verifyMutation.isPending}
                            className="text-xs shrink-0"
                          >
                            {isMaker ? 'Self-Verify Blocked' : 'Verify & Anchor Lot'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bank Statement CSV Import & 2-Way Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Import Bank Statement CSV
            </CardTitle>
            <CardDescription>
              Required columns: Date, Reference, Amount (KES). Duplicate rows are ignored automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCsvContent(await file.text());
                }
              }}
              className="text-xs text-zinc-600 dark:text-zinc-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
            />
            <textarea
              rows={5}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder={'Date,Reference,Amount\n2026-11-27,WIRE-892100,50000.00'}
              className="w-full font-mono text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5"
            />
            <Button
              type="button"
              variant="emerald"
              size="sm"
              disabled={!csvContent.trim()}
              isLoading={importCsvMutation.isPending}
              onClick={() => importCsvMutation.mutate(csvContent)}
            >
              Import Statement Lines
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              2-Way Bank Statement Reconciliation
            </CardTitle>
            <CardDescription>
              Matches verified bank deposits against imported statement lines and flags stale unmatched deposits (Rule R07).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <Input
                label="Unmatched Alert Window (days)"
                type="number"
                min="1"
                max="90"
                value={windowDays}
                onChange={(e) => setWindowDays(e.target.value)}
              />
              <Button
                type="button"
                variant="emerald"
                size="sm"
                isLoading={reconcileMutation.isPending}
                onClick={() => reconcileMutation.mutate(parseInt(windowDays || '7', 10))}
                className="shrink-0"
              >
                Run 2-Way Reconciliation
              </Button>
            </div>

            {reconReport && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                    <span className="block text-zinc-500">Matched</span>
                    <strong className="text-base text-emerald-700 dark:text-emerald-300">
                      {reconReport.matchedCount}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                    <span className="block text-zinc-500">Unmatched CSV</span>
                    <strong className="text-base text-amber-700 dark:text-amber-300">
                      {reconReport.unmatchedStatementCount}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800">
                    <span className="block text-zinc-500">Stale Deposits</span>
                    <strong className="text-base text-rose-700 dark:text-rose-300">
                      {reconReport.unmatchedDepositCount}
                    </strong>
                  </div>
                </div>

                {reconReport.unmatchedStatementLines.length > 0 && (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 space-y-1">
                    <strong className="block">Unmatched Statement Lines</strong>
                    {reconReport.unmatchedStatementLines.map((line) => (
                      <div key={line.id} className="flex justify-between font-mono text-[11px]">
                        <span>{line.reference}</span>
                        <Money amountMinor={Number(line.amountMinor)} />
                      </div>
                    ))}
                  </div>
                )}

                {reconReport.unmatchedLedgerDeposits.length > 0 && (
                  <div className="border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 space-y-1">
                    <strong className="block text-rose-700 dark:text-rose-300">
                      Stale Unmatched Verified Deposits (R07)
                    </strong>
                    {reconReport.unmatchedLedgerDeposits.map((dep) => (
                      <div key={dep.id} className="flex justify-between font-mono text-[11px]">
                        <span>{dep.reference}</span>
                        <Money amountMinor={Number(dep.amountMinor)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
