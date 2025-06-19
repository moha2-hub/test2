'use client'

import { useEffect } from 'react'
import { useTranslation } from "react-i18next";
import { logoutAction } from '../actions/logout'


export default function LogoutPage() {
  const { t } = useTranslation("common");

  useEffect(() => {
    // Call the server action
    logoutAction()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-lg text-muted-foreground">{t("loggingOut")}</span>
    </div>
  )
}

// Add this key to your translation files:
// "loggingOut": "Logging out..."
