import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, type TranslationKey } from './locales/en';
import { sw } from './locales/sw';

export type Locale = 'en' | 'sw';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
}

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  sw,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('charitychain_locale');
    return saved === 'sw' ? 'sw' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('charitychain_locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const toggleLocale = () => {
    setLocaleState((prev) => (prev === 'en' ? 'sw' : 'en'));
  };

  const t = (key: TranslationKey): string => {
    const dict = dictionaries[locale] || dictionaries.en;
    return dict[key] || en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

