import React, { useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  FileSpreadsheet,
  ShieldCheck,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileDown,
  PlusCircle,
} from 'lucide-react';
import { Money } from '@/components/Money';
import { api } from '@/lib/api';
import { authStore } from '@/store/auth.store';
import { hasPermission } from '@/features/authorization/permissions';
import { verifyReportOnChain, type OnChainVerifyResult } from '@/lib/web3Verify';
import type { PortalSession, QuarterlyReport } from '@/types';

export const ReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSyncExternalStore(authStore.subscribe, authStore.get) as {
    session: PortalSession | null;
  };
  const canGenerate = Boolean(session && hasPermission(session, 'report:generate'));

  const nowYear = new Date().getUTCFullYear();
  const [genYear, setGenYear] = useState(String(nowYear));
  const [genQuarter, setGenQuarter] = useState('1');
  const [genError, setGenError] = useState<string | null>(null);

  const [verifyInput, setVerifyInput] = useState('');
  const [verifyReportId, setVerifyReportId] = useState('');
  const [dbMatchStatus, setDbMatchStatus] = useState<'MATCH' | 'NONE' | 'MISMATCH'>('NONE');
  const [chainResult, setChainResult] = useState<OnChainVerifyResult | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  const { data: reports = [], isLoading } = useQuery<QuarterlyReport[]>({
    queryKey: ['quarterly-reports'],
    queryFn: () => api.getQuarterlyReports(),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.generateQuarterlyReport(parseInt(genYear, 10), parseInt(genQuarter, 10)),
    onSuccess: () => {
      setGenError(null);
      queryClient.invalidateQueries({ queryKey: ['quarterly-reports'] });
    },
    onError: (err: unknown) => {
      setGenError(err instanceof Error ? err.message : 'Unable to generate quarterly report.');
    },
  });

  const runVerification = async (targetHash: string, report?: QuarterlyReport) => {
    const query = targetHash.trim().toLowerCase();
    const matchedReport =
      report ||
      reports.find(
        (r) =>
          r.id === verifyReportId ||
          r.reportHash.toLowerCase() === query ||
          r.periodRoot.toLowerCase() === query
      );

    if (!matchedReport) {
      setDbMatchStatus('MISMATCH');
      setChainResult(null);
      return;
    }

    const dbMatched =
      matchedReport.reportHash.toLowerCase() === query ||
      matchedReport.periodRoot.toLowerCase() === query;
    setDbMatchStatus(dbMatched ? 'MATCH' : 'MISMATCH');

    setVerifyingChain(true);
    const res = await verifyReportOnChain({
      year: matchedReport.year,
      quarter: matchedReport.quarter,
      version: matchedReport.version,
      reportHash: matchedReport.reportHash,
    });
    setChainResult(res);
    setVerifyingChain(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await runVerification(verifyInput);
  };

  const downloadReportJson = (report: QuarterlyReport) => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `quarterly-report-${report.year}-Q${report.quarter}-v${report.version}.json`
    );
    dlAnchor.click();
  };

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
          Quarterly reports
        </h1>
      </div>

      {canGenerate && (
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              Generate quarterly report snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {genError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200"
              >
                {genError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateMutation.mutate();
              }}
              className="flex flex-col sm:flex-row gap-3 items-end"
            >
              <Input
                label="Year"
                type="number"
                min="2024"
                max="2035"
                value={genYear}
                onChange={(e) => setGenYear(e.target.value)}
                required
              />
              <div className="w-full sm:w-44">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Quarter
                </label>
                <select
                  value={genQuarter}
                  onChange={(e) => setGenQuarter(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs font-medium"
                >
                  <option value="1">Q1 (Jan – Mar)</option>
                  <option value="2">Q2 (Apr – Jun)</option>
                  <option value="3">Q3 (Jul – Sep)</option>
                  <option value="4">Q4 (Oct – Dec)</option>
                </select>
              </div>
              <Button
                type="submit"
                variant="emerald"
                isLoading={generateMutation.isPending}
                className="shrink-0"
              >
                Generate Report
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Verify a report (canonical hash + PeriodAnchor Web3.js)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Paste Report Hash or Period Root (0x...)"
              value={verifyInput}
              onChange={(e) => {
                setVerifyInput(e.target.value);
                setDbMatchStatus('NONE');
                setChainResult(null);
              }}
              className="font-mono text-xs"
              required
            />
            <Button
              type="submit"
              variant="emerald"
              isLoading={verifyingChain}
              className="sm:w-44 shrink-0"
            >
              Verify On-Chain
            </Button>
          </form>

          {dbMatchStatus === 'MISMATCH' && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              No published report in the ledger matches that Report Hash or Period Root.
            </div>
          )}

          {dbMatchStatus === 'MATCH' && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Canonical Database Digest Matched.
            </div>
          )}

          {chainResult && (
            <div
              className={`mt-3 p-3 rounded-lg border text-xs space-y-1 ${
                chainResult.status === 'VERIFIED'
                  ? 'bg-emerald-100/80 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : chainResult.status === 'MISMATCH'
                    ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="font-semibold">
                PeriodAnchor ({chainResult.status}): {chainResult.message}
              </div>
              {chainResult.onChainHash && (
                <div className="font-mono text-[11px] break-all">
                  On-Chain Hash: {chainResult.onChainHash}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Published reports</h2>

        {isLoading ? (
          <Card className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading published reports...</span>
          </Card>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center text-zinc-500 text-sm">
            No quarterly reports published yet.
          </Card>
        ) : (
          reports.map((r) => {
            const inflowMinor = Number(r.canonicalJson?.totalInflowMinor || 0);
            const outflowMinor = Number(r.canonicalJson?.totalDisbursedMinor || 0);
            const disbursementsCount = r.canonicalJson?.disbursementsCount ?? 0;

            return (
              <Card key={r.id} className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        Quarter {r.quarter}, {r.year} Report (v{r.version})
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Published
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500 pt-1">
                      <span>
                        Total Inflow:{' '}
                        <Money
                          amountMinor={inflowMinor}
                          className="text-zinc-800 dark:text-zinc-200 font-bold"
                        />
                      </span>
                      <span>&bull;</span>
                      <span>
                        Total Outflow:{' '}
                        <Money
                          amountMinor={outflowMinor}
                          className="text-zinc-800 dark:text-zinc-200 font-bold"
                        />
                      </span>
                      <span>&bull;</span>
                      <span>
                        Disbursements:{' '}
                        <strong className="text-zinc-800 dark:text-zinc-200">
                          {disbursementsCount}
                        </strong>
                      </span>
                    </div>

                    <div className="pt-2 font-mono text-[11px] text-zinc-500 space-y-1">
                      <div>
                        <span className="text-zinc-400">Canonical Hash: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 break-all">
                          {r.reportHash}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Period Root: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 break-all">
                          {r.periodRoot}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setVerifyReportId(r.id);
                        setVerifyInput(r.reportHash);
                        await runVerification(r.reportHash, r);
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verify On-Chain
                    </Button>
                    <a
                      href={api.getReportPdfUrl(r.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                      Download PDF
                    </a>
                    <Button
                      size="sm"
                      variant="emerald"
                      onClick={() => downloadReportJson(r)}
                      className="gap-1.5 text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download JSON
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
