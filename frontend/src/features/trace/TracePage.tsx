import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, getCertificateSvgUrl } from '@/lib/api';
import { verifyDonationOnChain, type OnChainVerifyResult } from '@/lib/web3Verify';
import { useTranslation } from '@/app/i18n/I18nContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusChip } from '@/components/StatusChip';
import { Money } from '@/components/Money';
import { DonorBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/EmptyState';
import { SankeyFlow } from './SankeyFlow';
import {
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Award,
} from 'lucide-react';
import type { DonationTrace } from '@/types';

export const TracePage: React.FC = () => {
  const { t } = useTranslation();
  const { receiptCode: routeCode } = useParams<{ receiptCode?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('receipt') || searchParams.get('code') || routeCode || '';

  const [searchInput, setSearchInput] = useState(queryParam);
  const [submittedCode, setSubmittedCode] = useState(queryParam);
  const [techDetailsOpen, setTechDetailsOpen] = useState(false);
  const [chainVerifyState, setChainVerifyState] = useState<{
    code: string;
    result: OnChainVerifyResult;
  } | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  const activeCode = queryParam || submittedCode;
  const chainVerify = chainVerifyState?.code === activeCode ? chainVerifyState.result : null;

  const { data: donation, isLoading, isError } = useQuery<DonationTrace | null>({
    queryKey: ['trace', activeCode],
    queryFn: () => api.getDonationTrace(activeCode),
    enabled: Boolean(activeCode),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const code = searchInput.trim().toUpperCase();
      setSubmittedCode(code);
      setSearchParams({ code });
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('traceTitle')}
        </h1>
      </div>

      {/* Search Bar */}
      <Card className="border-2 border-emerald-500/20 shadow-md">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('tracePlaceholder')}
                className="pl-11 font-mono uppercase tracking-wider text-base"
                required
              />
            </div>
            <Button type="submit" variant="emerald" className="sm:w-36 gap-2">
              <Search className="w-4 h-4" />
              {t('traceButton')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!activeCode && (
        <EmptyState
          title="Enter a receipt code to trace"
          description="Paste the receipt code from your M-Pesa confirmation, bank slip, or pharmacy receipt (for example MLK-XXXX-XXXX) to view lot allocations and audit verification."
        />
      )}

      {/* Loading State */}
      {Boolean(activeCode) && isLoading && (
        <Card className="p-12 text-center text-zinc-500">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
            <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
          </div>
        </Card>
      )}

      {/* Not Found */}
      {Boolean(activeCode) && !isLoading && !donation && !isError && (
        <EmptyState
          title={t('receiptNotFound')}
          description={t('receiptNotFoundDesc')}
        />
      )}

      {/* Result Display */}
      {!isLoading && donation && (
        <div className="space-y-6">
          {/* Main Summary Card */}
          <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="bg-zinc-50/70 dark:bg-zinc-900/60 p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-500 uppercase">{t('receiptCode')}</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {donation.receiptCode}
                  </span>
                  <a
                    href={getCertificateSvgUrl(donation.receiptCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ml-2"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Certificate</span>
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Money amountMinor={donation.amountMinor} currency={donation.currency} className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50" />
                  <StatusChip status={donation.status} />
                </div>
              </div>

              {/* Donor Recognition & Privacy */}
              <div className="flex items-center gap-2.5">
                {donation.donorBadge && <DonorBadge tier={donation.donorBadge} />}
                <div className="text-right">
                  <p className="text-xs text-zinc-500 font-medium">{t('donorRecognition')}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {donation.donorDisplayMode === 'ANONYMOUS' ? t('anonymous') : donation.donorAlias}
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Channel and Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/70 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-0.5">{t('railChannel')}</span>
                  <StatusChip status={donation.channel} />
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">{t('recordedTime')}</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {new Date(donation.recordedAt).toLocaleDateString('en-KE', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">{t('sourceReference')}</span>
                  <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{donation.sourceRef}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Earmark</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {donation.earmark ? donation.earmark : 'General Fund'}
                  </span>
                </div>
              </div>

              {/* Visual Sankey Lot Allocation Flow */}
              <SankeyFlow
                totalAmountMinor={donation.amountMinor}
                currency={donation.currency}
                channel={donation.channel}
                receiptCode={donation.receiptCode}
                allocations={donation.allocations}
              />

              {/* Impact / Allocation Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Student Case Allocation Impact
                  </h4>
                  <span className="text-xs text-zinc-500">
                    {donation.allocations.length} case{donation.allocations.length === 1 ? '' : 's'} supported
                  </span>
                </div>

                {donation.allocations.length === 0 ? (
                  <div className="p-5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 text-center text-xs text-zinc-500">
                    Not yet allocated. It is held in the emergency pool.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    {donation.allocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="p-4 bg-white dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold shrink-0 text-xs">
                            ✓
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {alloc.caseNumber}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                {alloc.caseCategory}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              Allocated {new Date(alloc.allocatedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right sm:text-right">
                          <Money
                            amountMinor={alloc.amountMinor}
                            className="text-base font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Verified Audit Ledger Card */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Recorded on audit ledger
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={verifyingChain}
                      onClick={async () => {
                        setVerifyingChain(true);
                        const res = await verifyDonationOnChain({
                          lotId: donation.lotId,
                          recordHash: donation.recordHash,
                        });
                        setChainVerifyState({ code: activeCode, result: res });
                        setVerifyingChain(false);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                    >
                      {verifyingChain ? 'Checking RPC...' : 'Verify on DonationLedger (Web3.js)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTechDetailsOpen(!techDetailsOpen)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                    >
                      <span>{techDetailsOpen ? 'Hide audit details' : 'View audit fingerprint'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${techDetailsOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {chainVerify && (
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      chainVerify.status === 'VERIFIED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : chainVerify.status === 'MISMATCH'
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                          : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <div className="font-semibold">
                      On-Chain Status ({chainVerify.status}): {chainVerify.message}
                    </div>
                    {chainVerify.contractAddress && (
                      <div className="font-mono text-[11px] break-all">
                        Contract: {chainVerify.contractAddress}
                      </div>
                    )}
                    {chainVerify.onChainHash && (
                      <div className="font-mono text-[11px] break-all">
                        On-Chain recordHash: {chainVerify.onChainHash}
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible Technical Details */}
                {techDetailsOpen && (
                  <div className="mt-3 p-4 rounded-lg bg-white dark:bg-zinc-900 text-xs font-mono space-y-2.5 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block text-[11px] mb-0.5">Audit Record Hash:</span>
                      <span className="break-all text-zinc-800 dark:text-zinc-200">
                        {donation.recordHash}
                      </span>
                    </div>
                    {donation.txHash && (
                      <div>
                        <span className="text-zinc-500 block text-[11px] mb-0.5">Blockchain Notarization:</span>
                        <a
                          href={`https://amoy.polygonscan.com/tx/${donation.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          {donation.txHash}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                    {donation.blockNumber && (
                      <div className="flex gap-6 pt-1 text-[11px]">
                        <div>
                          <span className="text-zinc-500">Block: </span>
                          <span className="text-zinc-800 dark:text-zinc-200">#{donation.blockNumber.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

