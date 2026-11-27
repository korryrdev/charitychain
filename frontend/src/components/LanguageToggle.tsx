import React from 'react';
import { useTranslation } from '@/app/i18n/I18nContext';
import { Languages } from 'lucide-react';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { locale, toggleLocale } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={`Switch language. Current language: ${locale === 'en' ? 'English' : 'Kiswahili'}`}
      className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${className}`}
    >
      <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
      <span className="tracking-wider uppercase">{locale === 'en' ? 'SW' : 'EN'}</span>
    </button>
  );
};

