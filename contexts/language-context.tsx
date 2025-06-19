"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import i18n from "i18next";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar"); // Default to Arabic
  const [isRTL, setIsRTL] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return; // Guard for SSR
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage === "en" || savedLanguage === "ar") {
      setLanguageState(savedLanguage);
      setIsRTL(savedLanguage === "ar");
      document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = savedLanguage;
      i18n.changeLanguage(savedLanguage); // Ensure i18n is synced on mount
    } else {
      setLanguageState("ar");
      setIsRTL(true);
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
      i18n.changeLanguage("ar"); // Default to Arabic
    }
  }, []);

  // Sync language changes across tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === "language" && (e.newValue === "en" || e.newValue === "ar")) {
        setLanguageState(e.newValue);
        setIsRTL(e.newValue === "ar");
        document.documentElement.dir = e.newValue === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = e.newValue;
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setIsRTL(lang === "ar");
    localStorage.setItem("language", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    i18n.changeLanguage(lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const value = useMemo(() => ({ language, setLanguage, isRTL, toggleLanguage }), [language, isRTL]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
