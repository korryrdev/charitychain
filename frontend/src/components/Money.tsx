import React from 'react';
import { cn } from '@/lib/utils';

interface MoneyProps {
  amountMinor: number | bigint;
  currency?: string;
  className?: string;
  showCurrency?: boolean;
}

/**
 * Formats integer minor units to human-readable currency.
 * In CharityChain, KES 1.00 = 100 minor units.
 */
export const formatKES = (minorUnits: number | bigint, showCurrency = true): string => {
  const numeric = typeof minorUnits === 'bigint' ? Number(minorUnits) : minorUnits;
  const major = numeric / 100;
  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);

  return showCurrency ? `KES ${formatted}` : formatted;
};

export const Money: React.FC<MoneyProps> = ({
  amountMinor,
  currency = 'KES',
  className,
  showCurrency = true,
}) => {
  if (currency === 'ITM') {
    return (
      <span className={cn('font-mono font-medium', className)}>
        {Number(amountMinor).toLocaleString()} items
      </span>
    );
  }

  return (
    <span className={cn('font-mono font-medium tracking-tight', className)}>
      {formatKES(amountMinor, showCurrency)}
    </span>
  );
};

