import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTranslation } from '@/app/i18n/I18nContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DonorBadge } from '@/components/ui/Badge';
import {
  Award,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Star,
  Users,
  Shield,
  ArrowRight,
  Flag,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { RecognitionEntry } from '@/types';

export const RecognitionWallPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportTarget, setReportTarget] = useState<RecognitionEntry | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<{ alertId: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recognitionWall'],
    queryFn: () => api.getRecognitionWall(),
  });

  const reportMutation = useMutation({
    mutationFn: ({ id, reason, contact }: { id: string; reason: string; contact?: string }) =>
      api.reportRecognitionName(id, { reason, reporterContact: contact }),
    onSuccess: (res, variables) => {
      setReportResult({
        alertId: res.alertId,
        name: reportTarget?.displayName || variables.id,
      });
      setReportTarget(null);
      setReportReason('');
      setReporterContact('');
      setReportError(null);
    },
    onError: (err: unknown) => {
      setReportError(
        err instanceof Error ? err.message : 'Unable to submit name report. Please try again.'
      );
    },
  });

  const entries = data?.entries || [];
  const anonymousCount = data?.anonymousCount || 0;

  const filteredEntries = entries.filter((entry) => {
    if (selectedTier === 'CONSISTENT') {
      if (!entry.isConsistentGiver && entry.tier !== 'CONSISTENT') return false;
    } else if (selectedTier !== 'ALL' && entry.tier !== selectedTier) {
      return false;
    }

    if (searchQuery.trim()) {
      return entry.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const tiers: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'ALL', label: 'All Supporters', icon: Users },
    { id: 'PATRON', label: 'Lifetime Patrons', icon: Sparkles },
    { id: 'GOLD', label: 'Gold Champions', icon: Star },
    { id: 'SILVER', label: 'Silver Supporters', icon: ShieldCheck },
    { id: 'BRONZE', label: 'Bronze Supporters', icon: Award },
    { id: 'CONSISTENT', label: 'Consistent Givers', icon: HeartHandshake },
  ];

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    if (reportReason.trim().length < 5) {
      setReportError('Please provide a brief reason of at least 5 characters.');
      return;
    }
    setReportError(null);
    reportMutation.mutate({
      id: reportTarget.id,
      reason: reportReason.trim(),
      contact: reporterContact.trim() || undefined,
    });
  };

  return (
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>{t('wallThankYou')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('wallTitle')}
        </h1>
      </div>

      {/* KDPA 2019 Inference Protection Callout (FR-DON-12) */}
      <Card className="border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                {t('wallPrivacyNote')}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400 block">
                KDPA 2019 inference protection: public recognition displays only chosen display names, milestone badges, and award month.
              </span>
            </div>
          </div>

          <Link to="/donor/claim" className="shrink-0 w-full sm:w-auto">
            <Button size="sm" variant="emerald" className="w-full sm:w-auto text-xs gap-1.5 shadow-sm">
              <span>{t('wallSetDisplayName')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {reportResult && (
        <div
          role="status"
          className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Name report submitted for committee review (<strong>{reportResult.name}</strong> · Alert{' '}
              <code>{reportResult.alertId.slice(0, 8)}</code>).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReportResult(null)}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
            aria-label={t('dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Anonymous Aggregation Banner (shown when >= 5 per FR-DON-12) */}
      {anonymousCount >= 5 && (
        <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold text-xs">
              ?
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {anonymousCount} {t('anonymousSupporters')}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-zinc-400 px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            Opted-out
          </span>
        </div>
      )}

      {/* Tier Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {tiers.map((tierTab) => {
            const Icon = tierTab.icon;
            const isSelected = selectedTier === tierTab.id;
            return (
              <button
                key={tierTab.id}
                type="button"
                onClick={() => setSelectedTier(tierTab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tierTab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={t('wallSearchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('wallSearchPlaceholder')}
            className="w-full h-9 min-h-[36px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          />
        </div>
      </div>

      {/* Inline Report Modal */}
      {reportTarget && (
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-name-heading"
          className="border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20"
        >
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="report-name-heading"
                  className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
                >
                  {t('wallReportTitle')}: {reportTarget.displayName}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Report offensive content or suspected impersonation. A committee member with moderation authority will review this entry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportTarget(null);
                  setReportError(null);
                }}
                aria-label="Close report dialog"
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportError && (
              <p role="alert" className="text-xs font-medium text-rose-700 dark:text-rose-300">
                {reportError}
              </p>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="report-name-reason"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Reason for reporting (minimum 5 characters)
                </label>
                <textarea
                  id="report-name-reason"
                  rows={3}
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe why this display name violates community standards or impersonates someone..."
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                />
              </div>

              <div>
                <label
                  htmlFor="report-name-contact"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Optional contact email or phone (never shown publicly)
                </label>
                <input
                  id="report-name-contact"
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="Leave blank to remain anonymous"
                  className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReportTarget(null);
                    setReportError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={reportMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
                >
                  {reportMutation.isPending ? 'Submitting...' : 'Submit report'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Wall Grid */}
      {isLoading ? (
        <Card className="p-10 text-center text-zinc-500">
          <p className="text-xs font-medium">{t('searching')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className="border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all hover:shadow-md"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <DonorBadge tier={entry.tier} />
                  <button
                    type="button"
                    onClick={() => {
                      setReportTarget(entry);
                      setReportReason('');
                      setReporterContact('');
                      setReportError(null);
                    }}
                    title="Report this name"
                    aria-label={`Report ${entry.displayName}`}
                    className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {entry.displayName}
                  </h3>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Display Mode:{' '}
                    {entry.displayMode === 'ALIAS' ? 'Pseudonymous Alias' : 'Confirmed Name'}
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span>Awarded {entry.awardedMonth}</span>
                  {entry.isConsistentGiver && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>3+ Months</span>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredEntries.length === 0 && (
        <Card className="p-12 text-center text-zinc-500">
          <p className="text-sm font-semibold">No supporters found matching this tier or filter.</p>
        </Card>
      )}
    </div>
  );
};
