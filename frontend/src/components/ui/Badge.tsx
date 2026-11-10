import React from 'react';
import { cn } from '@/lib/utils';
import type { BadgeTier } from '@/types';
import { Award, ShieldCheck, HeartHandshake, Sparkles, Star } from 'lucide-react';

interface DonorBadgeProps {
  tier: BadgeTier;
  className?: string;
}

const badgeConfig: Record<BadgeTier, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  BRONZE: {
    label: 'Bronze Supporter',
    icon: Award,
    className: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  },
  SILVER: {
    label: 'Silver Supporter',
    icon: ShieldCheck,
    className: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  },
  GOLD: {
    label: 'Gold Champion',
    icon: Star,
    className: 'bg-yellow-100 text-yellow-950 border-yellow-300 dark:bg-yellow-950/70 dark:text-yellow-300 dark:border-yellow-800',
  },
  PATRON: {
    label: 'Lifetime Patron',
    icon: Sparkles,
    className: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
  },
  CONSISTENT: {
    label: 'Consistent Giver',
    icon: HeartHandshake,
    className: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  },
};

export const DonorBadge: React.FC<DonorBadgeProps> = ({ tier, className }) => {
  const config = badgeConfig[tier];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs',
        config.className,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

