import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, FolderSearch } from 'lucide-react';
import { Button } from './ui/Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-4">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

