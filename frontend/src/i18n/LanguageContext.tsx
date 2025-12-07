import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize state with a simple approach to avoid the null error
  const [language, setLanguage] = useState<Language>('en');

  // Set initial language after component mounts
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('qubix-language') as Language;
      if (saved && ['en', 'pt', 'es'].includes(saved)) {
        setLanguage(saved);
      } else {
        // Detect browser language
        const browserLang = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
        if (browserLang === 'pt') setLanguage('pt');
        else if (browserLang === 'es') setLanguage('es');
        else setLanguage('en');
      }
    } catch (error) {
      console.warn('Error initializing language:', error);
      setLanguage('en');
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('qubix-language', lang);
    } catch (error) {
      console.warn('Error saving language to localStorage:', error);
    }
  };

  const t = (key: TranslationKey): string => {
    try {
      return translations[language][key] || translations.en[key] || key;
    } catch (error) {
      console.warn('Error translating key:', key, error);
      return key;
    }
  };

  const contextValue = React.useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t
  }), [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

