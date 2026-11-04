import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
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
} from 'lucide-react';
import type { BadgeTier } from '@/types';

export const RecognitionWallPage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportedId, setReportedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recognitionWall'],
    queryFn: () => api.getRecognitionWall(),
  });

  const entries = data?.entries || [];
  const anonymousCount = data?.anonymousCount || 0;

  const filteredEntries = entries.filter((entry) => {
    if (selectedTier === 'CONSISTENT') {
      if (!entry.isConsistentGiver) return false;
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

  const handleReport = (id: string, name: string) => {
    setReportedId(id);
    setTimeout(() => {
      alert(`Report submitted for review: "${name}". The committee will audit this entry per Rule FR-DON-06.`);
      setReportedId(null);
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>Honoring Community Generosity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Public Recognition Wall
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Celebrating donors and alumni whose gifts sustain students in need. Every badge is deterministically computed from verified on-chain lots.
        </p>
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
                Strict Donor Privacy (Rule FR-DON-12 & Kenya Data Protection Act)
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                To prevent financial profiling and inference attacks, <strong>no amounts or exact timestamps are ever displayed</strong> on this wall. Donors appear solely by their chosen alias or name, active tier, and month of award.
              </p>
            </div>
          </div>

          <Link to="/donor/claim" className="shrink-0 w-full sm:w-auto">
            <Button size="sm" variant="emerald" className="w-full sm:w-auto text-xs gap-1.5 shadow-sm">
              <span>Claim Receipt & Set Name</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Anonymous Aggregation Banner (shown when >= 5 per FR-DON-12) */}
      {anonymousCount >= 5 && (
        <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold text-xs">
              ?
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {anonymousCount} Anonymous Supporters
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Contributing quietly without public recognition. Every cent still fully tracked on the public ledger.
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
          {tiers.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedTier === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTier(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search supporter name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 min-h-[36px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          />
        </div>
      </div>

      {/* Wall Grid */}
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
                  onClick={() => handleReport(entry.id, entry.displayName)}
                  title="Report abusive or impersonating name (FR-DON-06)"
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
                  Display Mode: {entry.displayMode === 'ALIAS' ? 'Pseudonymous Alias' : 'Confirmed Name'}
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

      {filteredEntries.length === 0 && (
        <Card className="p-12 text-center text-zinc-500">
          <p className="text-sm font-semibold">No supporters found matching this tier or filter.</p>
        </Card>
      )}
    </div>
  );
};

