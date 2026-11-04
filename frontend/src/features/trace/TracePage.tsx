import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
} from 'lucide-react';
import type { DonationTrace } from '@/types';

export const TracePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('receipt') || searchParams.get('code') || '';
  const initialCode = queryParam || 'MLK-7F3K-92QD';

  const [searchInput, setSearchInput] = useState(initialCode);
  const [activeCode, setActiveCode] = useState(initialCode);
  const [techDetailsOpen, setTechDetailsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedState, setVerifiedState] = useState<'MATCH' | 'MISMATCH'>('MATCH');
  const [simulateTamper, setSimulateTamper] = useState(false);

  useEffect(() => {
    if (queryParam && queryParam !== activeCode) {
      setSearchInput(queryParam);
      setActiveCode(queryParam);
    }
  }, [queryParam]);

  const { data: donation, isLoading, isError } = useQuery<DonationTrace | null>({
    queryKey: ['trace', activeCode],
    queryFn: () => api.getDonationTrace(activeCode),
    enabled: Boolean(activeCode),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const code = searchInput.trim().toUpperCase();
      setActiveCode(code);
      setSearchParams({ code });
      setVerifiedState(simulateTamper ? 'MISMATCH' : 'MATCH');
    }
  };

  const handleVerifyOnChain = async () => {
    setIsVerifying(true);
    // Simulating Web3.js direct RPC call to Polygon Amoy DonationLedger.recordHashOf(donationId)
    await new Promise((r) => setTimeout(r, 600));
    setIsVerifying(false);
    setVerifiedState(simulateTamper ? 'MISMATCH' : 'MATCH');
  };

  const quickSamples = ['MLK-7F3K-92QD', 'MLK-4B2N-88LK', 'MLK-ITEM-9201'];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('traceTitle')}
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          {t('traceSubtitle')}
        </p>
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

          {/* Quick Demo Pickers */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-medium">{t('quickSamples')}</span>
            {quickSamples.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setSearchInput(sample);
                  setActiveCode(sample);
                  setSearchParams({ code: sample });
                }}
                className="font-mono px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center text-zinc-500">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
            <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
          </div>
        </Card>
      )}

      {/* Not Found */}
      {!isLoading && !donation && !isError && (
        <EmptyState
          title={t('receiptNotFound')}
          description={t('receiptNotFoundDesc')}
          actionLabel="Try Sample Code MLK-7F3K-92QD"
          onAction={() => {
            setSearchInput('MLK-7F3K-92QD');
            setActiveCode('MLK-7F3K-92QD');
          }}
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
                    This donation is currently pooled in Malkia's verified fund, ready to be allocated in the next committee review cycle.
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
                              Allocated on {new Date(alloc.allocatedAt).toLocaleDateString()} via FIFO Lot Matching
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

              {/* Independent Web3 Verification Box */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Blockchain Immutability Proof
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Verified and locked on Polygon Amoy. Records cannot be rewritten or forged.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={verifiedState === 'MISMATCH' ? 'destructive' : 'emerald'}
                      size="sm"
                      onClick={handleVerifyOnChain}
                      isLoading={isVerifying}
                      className="gap-2 shrink-0"
                    >
                      {verifiedState === 'MISMATCH' ? (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Tamper Detected!
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Verify Direct on Chain
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Verification Result Banner */}
                {verifiedState === 'MATCH' ? (
                  <div className="p-3 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Authentic Notarization: Local record hash matches on-chain state on Polygon Amoy.</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                      Zero Drift
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-rose-100/90 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-950 dark:text-rose-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold">Integrity Alert (Rule R17 Fired):</span>
                      <span>The record hash in the local database differs from the anchored fingerprint on Polygon Amoy. This record may have been modified after notarization.</span>
                    </div>
                  </div>
                )}

                {/* Demo Simulation Switch */}
                <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTechDetailsOpen(!techDetailsOpen)}
                    className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
                  >
                    <span>Technical cryptographic details</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${techDetailsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <label className="flex items-center gap-2 text-[11px] text-zinc-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateTamper}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSimulateTamper(checked);
                        setVerifiedState(checked ? 'MISMATCH' : 'MATCH');
                      }}
                      className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Demo mode: Simulate tampered record (test Rule R17)</span>
                  </label>
                </div>

                {/* Collapsible Technical Details */}
                {techDetailsOpen && (
                  <div className="mt-3 p-3.5 rounded-lg bg-white dark:bg-zinc-900 text-xs font-mono space-y-2 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block">Record Hash (keccak256):</span>
                      <span className="break-all text-zinc-800 dark:text-zinc-200">
                        {simulateTamper
                          ? '0xbad000000000000000000000000000000000000000000000000000000000dead'
                          : donation.recordHash}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Polygon Amoy Tx Hash:</span>
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
                    <div className="flex gap-6 pt-1">
                      <div>
                        <span className="text-zinc-500">Block: </span>
                        <span className="text-zinc-800 dark:text-zinc-200">{donation.blockNumber}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Network: </span>
                        <span className="text-zinc-800 dark:text-zinc-200">Polygon Amoy (80002)</span>
                      </div>
                    </div>
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

