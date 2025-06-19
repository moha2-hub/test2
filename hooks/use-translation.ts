"use client"

import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"

export function useTranslation() {
  const { language } = useLanguage()

  const t = (key: string) => {
    const translation = translations[language]?.[key as keyof (typeof translations)[typeof language]]
    return translation || key
  }

  return { t, language }
}
