"use client";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "sonner";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@/app/i18n";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const i18n = createI18n();
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        {children}
        <Toaster position="top-right" />
      </LanguageProvider>
    </I18nextProvider>
  );
}
