"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect directly to login page
    router.push("/login")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">MOHSTORE</h1>
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    </div>
  )
}
