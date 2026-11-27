import React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from '@/app/i18n/I18nContext';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { locale, toggleLocale } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={`Switch language. Current language: ${locale === 'en' ? 'English' : 'Kiswahili'}`}
      className={`cc-header-util-btn ${className}`.trim()}
    >
      <Languages size={15} strokeWidth={1.9} aria-hidden="true" />
      <span>{locale === 'en' ? 'SW' : 'EN'}</span>
    </button>
  );
};
