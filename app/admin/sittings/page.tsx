"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Dummy logout function (replace with real logic if needed)
async function logout() {
  if (typeof window !== "undefined") {
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = "/login"
  }
}

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match")
      return
    }
    setIsLoading(true)
    try {
      // Replace with real API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessage("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setMessage("Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your admin account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleChangePassword}>
              {message && (
                <div
                  className="text-sm mb-2 rounded p-2"
                  style={{
                    background: message.includes("success") ? "#dcfce7" : "#fee2e2",
                    color: message.includes("success") ? "#166534" : "#b91c1c",
                  }}
                >
                  {message}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
