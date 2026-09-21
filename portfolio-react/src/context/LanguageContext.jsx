import { createContext, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureLanguageLoaded } from '@/i18n/index.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  // Cambio de idioma con lazy-load del chunk correspondiente.
  const setLang = useCallback(
    async (newLang) => {
      const target = newLang?.startsWith('en') ? 'en' : 'es';
      try {
        await ensureLanguageLoaded(target);
      } finally {
        await i18n.changeLanguage(target);
      }
    },
    [i18n],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, i18n }),
    [lang, setLang, t, i18n],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
