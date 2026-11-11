import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/app/auth/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/Money';
import { StatusChip } from '@/components/StatusChip';
import { DonorBadge } from '@/components/ui/Badge';
import {
  HeartHandshake,
  Award,
  Sparkles,
  Layers,
  Search,
  ExternalLink,
  Shield,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  FileCheck2,
  Settings,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  User,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { DisplayMode, BadgeTier } from '@/types';

export const DonorPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'CONTRIBUTIONS' | 'SETTINGS'>('CONTRIBUTIONS');

  // Receipt claim state
  const [claimReceiptCode, setClaimReceiptCode] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // Expanded lots state
  const [expandedLots, setExpandedLots] = useState<Record<string, boolean>>({});

  // Settings form state
  const [displayMode, setDisplayMode] = useState<DisplayMode>('ALIAS');
  const [customAlias, setCustomAlias] = useState('');
  const [showTotal, setShowTotal] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Fetch live donor dashboard
  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ['donor-dashboard'],
    queryFn: async () => {
      const data = await api.getDonorPortalDashboard();
      if (data?.settings) {
        setDisplayMode((data.settings.displayMode as DisplayMode) || 'ALIAS');
        setCustomAlias(data.settings.publicAlias || '');
        setShowTotal(Boolean(data.settings.showContributionTotal));
        setShowBadge(Boolean(data.settings.showRecognitionTier));
      }
      return data;
    },
  });

  // Claim receipt mutation
  const claimMutation = useMutation({
    mutationFn: (receiptCode: string) => api.claimReceiptToAccount(receiptCode),
    onSuccess: (res) => {
      setClaimSuccess(res.message);
      setClaimReceiptCode('');
      setClaimError(null);
      queryClient.invalidateQueries({ queryKey: ['donor-dashboard'] });
      setTimeout(() => setClaimSuccess(null), 5000);
    },
    onError: (err: any) => {
      setClaimError(err.message || 'Failed to link donation receipt.');
      setClaimSuccess(null);
    },
  });

  // Update settings mutation
  const settingsMutation = useMutation({
    mutationFn: (newSettings: any) => api.updateDonorPortalSettings(newSettings),
    onSuccess: () => {
      setSettingsSuccess(true);
      setSettingsError(null);
      queryClient.invalidateQueries({ queryKey: ['donor-dashboard'] });
      setTimeout(() => setSettingsSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSettingsError(err.message || 'Failed to save settings.');
    },
  });

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimReceiptCode.trim()) return;
    claimMutation.mutate(claimReceiptCode.trim());
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    settingsMutation.mutate({
      displayMode,
      publicAlias: customAlias.trim() || undefined,
      publicListed: displayMode !== 'ANONYMOUS',
      showContributionTotal: showTotal,
      showRecognitionTier: showBadge,
    });
  };

  const toggleLotExpansion = (lotId: string) => {
    setExpandedLots((prev) => ({ ...prev, [lotId]: !prev[lotId] }));
  };

  const rawTier = dashboard?.profile?.recognitionTier;
  const currentTier = (rawTier && rawTier !== 'UNRANKED' ? rawTier : null) as BadgeTier | null;
  const nextTier = dashboard?.nextTier;
  const summary = dashboard?.summary;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Welcome & Donor Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-zinc-900 text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                Verified Supporter
              </span>
              <span className="text-xs text-emerald-100 font-mono">
                {dashboard?.donorRef ? `${dashboard.donorRef.slice(0, 16)}...` : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {dashboard?.settings?.publicAlias || user?.name || 'Supporter'}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              Every shilling you contribute is tracked in FIFO order and notarized with cryptographic proofs on Polygon Amoy.
            </p>
          </div>

          {/* Badge & Recognition Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/10 text-amber-300">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">Current Recognition</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-extrabold text-sm sm:text-base text-white">
                    {currentTier ? `${currentTier} Supporter` : 'Rising Contributor'}
                  </span>
                  {currentTier && <DonorBadge tier={currentTier} />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Tier Progress Bar if applicable */}
        {nextTier && (
          <div className="mt-6 pt-5 border-t border-white/15 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-100">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Progress to {nextTier.tier} Tier</span>
              </span>
              <span className="font-mono font-bold">
                {nextTier.progressPercent}% Completed • Need <Money amountMinor={nextTier.remainingMinor} currency="KES" className="inline text-white font-bold" /> more
              </span>
            </div>
            <div className="w-full bg-black/30 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-amber-300 to-emerald-300 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${nextTier.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Impact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Total Donated</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <Money
            amountMinor={Number(summary?.totalDonatedMinor || 0)}
            currency="KES"
            className="text-2xl font-black text-zinc-900 dark:text-zinc-50 block pt-1"
          />
          <span className="text-[11px] text-zinc-400 block">{summary?.lotsCount || 0} intake lots recorded</span>
        </Card>

        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Directly Allocated</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <Money
            amountMinor={Number(summary?.totalAllocatedMinor || 0)}
            currency="KES"
            className="text-2xl font-black text-blue-600 dark:text-blue-400 block pt-1"
          />
          <span className="text-[11px] text-zinc-400 block">Consumed by vetted cases</span>
        </Card>

        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Students Supported</span>
            <FileCheck2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50 pt-1">
            {summary?.casesSupportedCount || 0} Students
          </div>
          <span className="text-[11px] text-zinc-400 block">Tuition, medicine & books</span>
        </Card>

        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Wall Display Mode</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="pt-1">
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {dashboard?.settings?.displayMode === 'ANONYMOUS'
                ? 'Anonymous'
                : dashboard?.settings?.displayMode === 'NAMED'
                ? 'Real Name'
                : 'Alias Handle'}
            </span>
            <span className="text-[11px] text-zinc-400 block truncate mt-0.5">
              {dashboard?.settings?.displayMode === 'ANONYMOUS'
                ? 'Hidden from public wall'
                : dashboard?.settings?.publicAlias || user?.name}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('CONTRIBUTIONS')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'CONTRIBUTIONS'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Contributions & FIFO Flow ({dashboard?.lots?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'SETTINGS'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Privacy & Recognition Settings</span>
        </button>
      </div>

      {/* Tab 1: Contributions & Link Receipt */}
      {activeTab === 'CONTRIBUTIONS' && (
        <div className="space-y-6">
          {/* Link / Claim Receipt Card */}
          <Card className="border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-sm font-bold">Link an Existing Donation Receipt</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Made a contribution via M-Pesa, bank wire, or pharmacy drop-off before registering? Enter your receipt code to attach it to your account.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleClaimSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="text"
                    placeholder="Enter receipt code (e.g. MLK-FIFO-1-8095 or MLK-7F3K-92QD)"
                    value={claimReceiptCode}
                    onChange={(e) => setClaimReceiptCode(e.target.value)}
                    className="pl-9 font-mono text-xs h-10 uppercase bg-white dark:bg-zinc-900"
                  />
                </div>
                <Button
                  type="submit"
                  variant="emerald"
                  disabled={claimMutation.isPending || !claimReceiptCode.trim()}
                  className="text-xs h-10 px-5 gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{claimMutation.isPending ? 'Linking...' : 'Link to Account'}</span>
                </Button>
              </form>

              {claimSuccess && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{claimSuccess}</span>
                </div>
              )}

              {claimError && (
                <div className="mt-3 p-3 rounded-xl bg-red-100/70 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{claimError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contributions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>Recorded Donation Lots</span>
                <span className="text-xs font-normal text-zinc-500">
                  ({dashboard?.lots?.length || 0} gifts)
                </span>
              </h3>
              <Link to="/trace">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  <span>Public Ledger Trace</span>
                </Button>
              </Link>
            </div>

            {(!dashboard?.lots || dashboard.lots.length === 0) ? (
              <Card className="p-12 text-center border-dashed border-2 text-zinc-500 space-y-3">
                <HeartHandshake className="w-10 h-10 mx-auto text-zinc-400 opacity-60" />
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Contributions Linked Yet</h4>
                <p className="text-xs max-w-md mx-auto">
                  When you contribute via M-Pesa, bank wire, or drop off in-kind medicines, link your receipt code above to track where your donation goes.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {dashboard.lots.map((lot) => {
                  const isExpanded = Boolean(expandedLots[lot.id]);
                  const totalMinor = Number(lot.totalAmountMinor);
                  const remainingMinor = Number(lot.remainingAmountMinor);
                  const allocatedMinor = totalMinor - remainingMinor;
                  const percentAllocated = totalMinor > 0 ? Math.round((allocatedMinor / totalMinor) * 100) : 0;

                  return (
                    <Card key={lot.id} className="border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
                      {/* Lot Header Row */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {lot.receiptCode}
                            </span>
                            <StatusChip status={lot.channel as any} />
                            {lot.isExhausted ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                100% Disbursed
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Active in Pool
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(lot.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {lot.earmark && <span>Earmark: {lot.earmark}</span>}
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <Money
                              amountMinor={totalMinor}
                              currency={lot.currency}
                              className="text-lg font-black text-zinc-900 dark:text-zinc-50"
                            />
                            <span className="text-[11px] text-zinc-400 block">
                              {percentAllocated}% allocated to students
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link to={`/trace?code=${lot.receiptCode}`}>
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                                <Search className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Audit</span>
                              </Button>
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleLotExpansion(lot.id)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                              aria-label="Toggle details"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Case Allocations */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Where your funds went (FIFO lot allocations)</span>
                          </h4>

                          {lot.allocations.length === 0 ? (
                            <div className="text-xs text-zinc-500 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                              This donation is currently queued in the common pool and will be allocated to upcoming verified cases.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {lot.allocations.map((alloc) => (
                                <div
                                  key={alloc.id}
                                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                        {alloc.caseNumber}
                                      </span>
                                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        {alloc.needCategory}
                                      </span>
                                      <StatusChip status={alloc.state as any} />
                                    </div>
                                    {alloc.justification && (
                                      <p className="text-[11px] text-zinc-500 italic max-w-md">
                                        "{alloc.justification}"
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                                    <Money
                                      amountMinor={Number(alloc.amountMinor)}
                                      currency={lot.currency}
                                      className="font-bold text-zinc-900 dark:text-zinc-100"
                                    />
                                    <span className="text-[10px] text-zinc-400">
                                      Allocated {new Date(alloc.allocatedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Settings & Privacy Customization */}
      {activeTab === 'SETTINGS' && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm max-w-3xl">
          <form onSubmit={handleSettingsSubmit}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>Recognition & Privacy Preferences</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Control how you appear on the public Supporter Wall and whether your contribution total is visible.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {settingsSuccess && (
                <div className="p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Privacy preferences updated successfully!</span>
                </div>
              )}

              {settingsError && (
                <div className="p-3 rounded-xl bg-red-100/70 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{settingsError}</span>
                </div>
              )}

              {/* Display Mode Radio Group */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Recognition Wall Visibility
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Anonymous */}
                  <label
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      displayMode === 'ANONYMOUS'
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Anonymous</span>
                      <input
                        type="radio"
                        name="displayMode"
                        value="ANONYMOUS"
                        checked={displayMode === 'ANONYMOUS'}
                        onChange={() => setDisplayMode('ANONYMOUS')}
                        className="accent-emerald-600"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Your identity and handle are completely hidden. Your gift is counted in aggregates only.
                    </p>
                  </label>

                  {/* Pseudonym Alias */}
                  <label
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      displayMode === 'ALIAS'
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Pseudonym Alias</span>
                      <input
                        type="radio"
                        name="displayMode"
                        value="ALIAS"
                        checked={displayMode === 'ALIAS'}
                        onChange={() => setDisplayMode('ALIAS')}
                        className="accent-emerald-600"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Display an avatar and customized handle (e.g. Star-Gazer-99) without revealing personal details.
                    </p>
                  </label>

                  {/* Full Real Name */}
                  <label
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      displayMode === 'NAMED'
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Confirmed Name</span>
                      <input
                        type="radio"
                        name="displayMode"
                        value="NAMED"
                        checked={displayMode === 'NAMED'}
                        onChange={() => setDisplayMode('NAMED')}
                        className="accent-emerald-600"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Display your verified name ({dashboard?.settings?.confirmedName || user?.name}) proudly on the Supporter Wall.
                    </p>
                  </label>
                </div>
              </div>

              {/* Custom Alias Input if Alias mode selected */}
              {displayMode === 'ALIAS' && (
                <div className="space-y-1.5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Custom Pseudonym Handle
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Wise-Weaver-4040"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="text-xs h-10 max-w-sm bg-white dark:bg-zinc-950"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Subject to automated decency & non-impersonation screening.
                  </p>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  Public Recognition Toggles
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTotal}
                      onChange={(e) => setShowTotal(e.target.checked)}
                      className="rounded accent-emerald-600 w-4 h-4"
                    />
                    <span>Show my total contribution amount on the public recognition wall</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBadge}
                      onChange={(e) => setShowBadge(e.target.checked)}
                      className="rounded accent-emerald-600 w-4 h-4"
                    />
                    <span>Show my milestone tier badge (e.g. Gold / Silver) publicly</span>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                variant="emerald"
                disabled={settingsMutation.isPending}
                className="text-xs px-6 h-10 gap-1.5 font-semibold"
              >
                <Sliders className="w-4 h-4" />
                <span>{settingsMutation.isPending ? 'Saving...' : 'Save Privacy Preferences'}</span>
              </Button>
            </CardContent>
          </form>
        </Card>
      )}
    </div>
  );
};
export default DonorPortalPage;
