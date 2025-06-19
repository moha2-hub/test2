"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import Link from "next/link"

export default function LoginPage() {
  const { t } = useTranslation("common");
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
  const registered = searchParams.get("registered") === "true"

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    try {
      const result = await login(formData)
      if (result.success) {
        const role = result.user.role
        if (role === "admin") {
          router.push("/admin")
        } else if (role === "customer") {
          router.push("/customer")
        } else if (role === "seller") {
          router.push("/seller")
        } else {
          router.push("/")
        }
      } else {
        setError(result.message || t("loginFailed"))
      }
    } catch (err) {
      setError(t("unexpectedError"))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("login")}</CardTitle>
          <CardDescription>{t("welcome")}</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {registered && (
              <div className="text-green-600 text-sm mb-2">{t("registeredSuccess")}</div>
            )}
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required disabled={isLoading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("loading") : t("login")}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t("noAccount")} <Link href="/register" className="underline">{t("register")}</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
