import React from 'react';
import { useTheme } from '@/app/theme/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Current theme is ${resolvedTheme}. Click to switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode.`}
      className={cn(
        'inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 select-none shadow-xs',
        showLabel ? 'px-3 gap-2' : 'p-2',
        className
      )}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-700 transition-transform duration-200 hover:-rotate-12" aria-hidden="true" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold">
          {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

