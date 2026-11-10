import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileSpreadsheet, ShieldCheck, Download, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Money } from '@/components/Money';
import { api } from '@/lib/api';
import type { QuarterlyReport } from '@/types';

export const ReportsPage: React.FC = () => {
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<'MATCH' | 'NONE' | 'ERROR'>('NONE');

  const { data: reports = [], isLoading } = useQuery<QuarterlyReport[]>({
    queryKey: ['quarterly-reports'],
    queryFn: () => api.getQuarterlyReports(),
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const query = verifyInput.trim().toLowerCase();
    const match = reports.some(
      (r) =>
        r.reportHash.toLowerCase() === query ||
        r.periodRoot.toLowerCase() === query
    );
    setVerifyResult(match ? 'MATCH' : 'ERROR');
  };

  const downloadReportJson = (report: QuarterlyReport) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `quarterly-report-${report.year}-Q${report.quarter}-v${report.version}.json`);
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

      <Card className="border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Verify a report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Paste Report Hash or Period Root (0x...)"
              value={verifyInput}
              onChange={(e) => {
                setVerifyInput(e.target.value);
                setVerifyResult('NONE');
              }}
              className="font-mono text-xs"
              required
            />
            <Button type="submit" variant="emerald" className="sm:w-36 shrink-0">
              Verify On-Chain
            </Button>
          </form>

          {verifyResult === 'MATCH' && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Verified Authentic: This report hash matches the anchored record on PeriodAnchor on Polygon Amoy.
            </div>
          )}

          {verifyResult === 'ERROR' && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              No matching anchored record found for this hash. The file may have been altered or tampered with.
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
                        Anchored
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500 pt-1">
                      <span>
                        Total Inflow: <Money amountMinor={inflowMinor} className="text-zinc-800 dark:text-zinc-200 font-bold" />
                      </span>
                      <span>•</span>
                      <span>
                        Total Outflow: <Money amountMinor={outflowMinor} className="text-zinc-800 dark:text-zinc-200 font-bold" />
                      </span>
                      <span>•</span>
                      <span>Disbursements: <strong className="text-zinc-800 dark:text-zinc-200">{disbursementsCount}</strong></span>
                    </div>

                    <div className="pt-2 font-mono text-[11px] text-zinc-500 space-y-1">
                      <div>
                        <span className="text-zinc-400">Canonical Hash: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 break-all">{r.reportHash}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Period Root: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 break-all">{r.periodRoot}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setVerifyInput(r.reportHash);
                        setVerifyResult('MATCH');
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verify Hash
                    </Button>
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
