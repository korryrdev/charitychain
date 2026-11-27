import React from 'react';
import { useTranslation } from '@/app/i18n/I18nContext';

export const SkipLink: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  const { t } = useTranslation();
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-xs font-semibold"
    >
      {t('skipToMain')}
    </a>
  );
};
