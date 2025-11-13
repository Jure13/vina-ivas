"use client";

import React, { createContext, useState, ReactNode, useContext, useEffect } from "react";
import { Language } from "../translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("hr"); // default SSR-safe

  // Load saved language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("language") as Language | null;
    if (stored) setLanguageState(stored);
  }, []);

  // Wrapper to update both state and localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
};