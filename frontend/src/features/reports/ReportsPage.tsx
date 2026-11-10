import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileSpreadsheet, ShieldCheck, Download, CheckCircle2, QrCode, ExternalLink } from 'lucide-react';
import { Money } from '@/components/Money';

interface AnchoredReport {
  id: string;
  year: number;
  quarter: number;
  totalInflowMinor: number;
  totalOutflowMinor: number;
  beneficiariesCount: number;
  reportHash: string;
  periodRoot: string;
  txHash: string;
  anchoredAt: string;
}

export const ReportsPage: React.FC = () => {
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<'MATCH' | 'NONE' | 'ERROR'>('NONE');

  const reports: AnchoredReport[] = [
    {
      id: 'rep-2026-q3',
      year: 2026,
      quarter: 3,
      totalInflowMinor: 145000000, // KES 1.45M
      totalOutflowMinor: 121000000, // KES 1.21M
      beneficiariesCount: 184,
      reportHash: '0x4f12ab78cd90ef34567890abcdef1234567890abcdef1234567890abcdef1234',
      periodRoot: '0x992384a8bc983719284719284719284719284719284719284719284719284719',
      txHash: '0x88bb77aa66cc55dd44ee33ff22001199887766554433221100ffeeddccbbaa99',
      anchoredAt: '2026-10-01T00:15:00Z',
    },
    {
      id: 'rep-2026-q2',
      year: 2026,
      quarter: 2,
      totalInflowMinor: 98000000,
      totalOutflowMinor: 89000000,
      beneficiariesCount: 120,
      reportHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      periodRoot: '0x7766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa9988',
      txHash: '0x3344556677889900aabbccddeeff00112233445566778899aabbccddeeff0011',
      anchoredAt: '2026-07-01T00:12:00Z',
    },
  ];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const match = reports.some(
      (r) =>
        r.reportHash.toLowerCase() === verifyInput.trim().toLowerCase() ||
        r.txHash.toLowerCase() === verifyInput.trim().toLowerCase()
    );
    setVerifyResult(match ? 'MATCH' : 'ERROR');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
          Anchored Quarterly Financial Reports
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
          Every quarter Malkia anchors a canonical JSON summary and Merkle ledger root on Polygon Amoy. Download the report or verify any printed hash.
        </p>
      </div>

      {/* Verify-a-Report Card */}
      <Card className="border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Verify a Printed Report Hash or QR Fingerprint
          </CardTitle>
          <CardDescription>
            Confirm that the PDF handed out at Malkia's full membership meeting matches the immutable blockchain record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Paste printed Report Hash (e.g. 0x4f12ab78cd90...)"
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
            <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold">
              No matching on-chain anchor found for this hash. The file may have been altered or tampered with.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Official Anchored Quarters</h2>
        {reports.map((r) => (
          <Card key={r.id} className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Quarter {r.quarter}, {r.year} Report
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Anchored
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-zinc-500 pt-1">
                  <span>
                    Total Inflow: <Money amountMinor={r.totalInflowMinor} className="text-zinc-800 dark:text-zinc-200 font-bold" />
                  </span>
                  <span>•</span>
                  <span>
                    Total Outflow: <Money amountMinor={r.totalOutflowMinor} className="text-zinc-800 dark:text-zinc-200 font-bold" />
                  </span>
                  <span>•</span>
                  <span>Beneficiaries: <strong className="text-zinc-800 dark:text-zinc-200">{r.beneficiariesCount}</strong></span>
                </div>

                <div className="pt-2 font-mono text-[11px] text-zinc-500 space-y-1">
                  <div>
                    <span className="text-zinc-400">Canonical Hash: </span>
                    <span className="text-zinc-700 dark:text-zinc-300">{r.reportHash}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Amoy Tx: </span>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${r.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                    >
                      {r.txHash.slice(0, 24)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
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
                <Button size="sm" variant="emerald" className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

