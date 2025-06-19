"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { register } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowRight, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function RegisterPage() {
  const { t } = useTranslation("common");
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await register(formData)

      if (result.success) {
        // Redirect to login page with a success message
        router.push("/login?registered=true")
      } else {
        setError(result.message || "Registration failed")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md overflow-hidden border-none shadow-xl">
        <div className="bg-primary p-6 text-primary-foreground">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <UserPlus className="h-6 w-6" />
            MOHSTORE
          </div>
          <p className="mt-2 text-sm opacity-90">{t("createAccountPrompt")}</p>
        </div>

        <CardContent className="p-6 pt-8">
          <form action={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500">
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                {t("username")}
              </Label>
              <Input id="username" name="username" placeholder={t("usernamePlaceholder")}
                className="h-11" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("email")}
              </Label>
              <Input id="email" name="email" type="email" placeholder={t("emailPlaceholder")}
                className="h-11" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("password")}
              </Label>
              <Input id="password" name="password" type="password" placeholder={t("passwordPlaceholder")}
                className="h-11" required />
              <p className="text-xs text-gray-500">{t("passwordHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-sm font-medium">
                {t("whatsapp")}
              </Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                placeholder={t("whatsappPlaceholder")}
                className="h-11"
                required
              />
              <p className="text-xs text-gray-500">{t("whatsappHint")}</p>
            </div>

            <Button type="submit" className="h-11 w-full text-base" disabled={isLoading}>
              {isLoading ? t("creatingAccount") : t("createAccount")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t bg-gray-50 p-6">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600">{t("alreadyHaveAccount")}</span>
            <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              {t("signIn")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

// Add these keys to your translation files:
// "createAccountPrompt": "Create a new account to get started",
// "username": "Username",
// "usernamePlaceholder": "johndoe",
// "emailPlaceholder": "name@example.com",
// "passwordPlaceholder": "••••••••",
// "passwordHint": "Password must be at least 8 characters long",
// "whatsapp": "WhatsApp Number",
// "whatsappPlaceholder": "+1234567890",
// "whatsappHint": "Enter your WhatsApp number with country code",
// "creatingAccount": "Creating account...",
// "createAccount": "Create Account",
// "alreadyHaveAccount": "Already have an account?",
// "signIn": "Sign in"
