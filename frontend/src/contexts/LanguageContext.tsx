import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  availableLanguages: { code: string; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  const availableLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'sw', name: 'Kiswahili', nativeName: 'Kiswahili' },
  ];

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      // Update document language attribute
      document.documentElement.lang = language;
      
      // Store preference in localStorage
      localStorage.setItem('preferred-language', language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  useEffect(() => {
    // Set initial language from localStorage or browser preference
    const storedLanguage = localStorage.getItem('preferred-language');
    if (storedLanguage && storedLanguage !== currentLanguage) {
      changeLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    // Listen for language changes from i18next
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
