import React from 'react';
import { cn } from '@/lib/utils';
import type { CaseState, Channel } from '@/types';

type ChipType = CaseState | Channel | 'RECEIVED' | 'POOLED' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED';

interface StatusChipProps {
  status: ChipType;
  className?: string;
}

const statusStyles: Record<ChipType, { label: string; className: string }> = {
  // Case States
  DRAFT: {
    label: 'Draft',
    className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  NEEDS_INFO: {
    label: 'Needs Info',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  APPROVED: {
    label: 'Approved (Awaiting Signatures)',
    className: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  AUTHORIZED: {
    label: '2-of-3 Authorized',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  DISBURSED: {
    label: 'Disbursed',
    className: 'bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  CLOSED: {
    label: 'Closed & Anchored',
    className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  },

  // Donation States
  RECEIVED: {
    label: 'Received',
    className: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  POOLED: {
    label: 'Pooled in Fund',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  PARTIALLY_ALLOCATED: {
    label: 'Partially Allocated',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  FULLY_ALLOCATED: {
    label: '100% Impact Allocated',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },

  // Channels
  MPESA: {
    label: 'M-Pesa C2B',
    className: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  BANK: {
    label: 'Bank Transfer',
    className: 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  IN_KIND: {
    label: 'Hospital Pharmacy Item',
    className: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const config = statusStyles[status] || { label: status, className: 'bg-zinc-100 text-zinc-700 border-zinc-200' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {config.label}
    </span>
  );
};

