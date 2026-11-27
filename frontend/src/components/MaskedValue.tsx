import React from 'react';

export function maskValue(value: string | number | null | undefined, visible = 4, replacement = '•'): string {
  const text = String(value ?? '');
  if (!text) return '—';
  if (text.length <= visible) return replacement.repeat(text.length);
  return `${replacement.repeat(text.length - visible)}${text.slice(-visible)}`;
}

interface MaskedValueProps {
  value: string | number | null | undefined;
  visible?: number;
  replacement?: string;
  className?: string;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({
  value,
  visible = 4,
  replacement = '•',
  className = '',
}) => {
  return (
    <span className={`font-mono ${className}`} title={String(value ?? '')}>
      {maskValue(value, visible, replacement)}
    </span>
  );
};

