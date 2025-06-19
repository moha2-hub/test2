"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { getSellerWalletData, requestWithdrawal } from "@/app/actions/wallet"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

type Withdrawal = {
  id: number
  amount: number
  status: string
  created_at: string
}

export default function MyWalletPage() {
  const [points, setPoints] = useState(0)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchWallet() {
      const data = await getSellerWalletData()
      setPoints(data.points)
      setWithdrawals(data.withdrawals)
    }
    fetchWallet()
  }, [])

  const handleWithdraw = async () => {
    const amt = parseInt(amount)
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" })
      return
    }

    if (amt > points) {
      toast({ title: "Not enough points", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    const res = await requestWithdrawal(amt)
    setIsSubmitting(false)

    if (res.success) {
      toast({ title: "Request submitted" })
      setAmount("")
      setPoints(points - amt)
      setWithdrawals([{ id: Date.now(), amount: amt, status: "pending", created_at: new Date().toISOString() }, ...withdrawals])
    } else {
      toast({ title: "Error", description: res.message, variant: "destructive" })
    }
  }

  return (
    <DashboardLayout userRole="seller">
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">My Wallet</h1>

        <Card>
          <CardHeader>
            <CardTitle>Available Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-green-600 font-bold">{points} pts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdraw Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button onClick={handleWithdraw} disabled={isSubmitting}>
                Withdraw
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Points will be converted to money manually by admin.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-muted-foreground">No withdrawals yet.</p>
            ) : (
              <ul className="space-y-2">
                {withdrawals.map((w) => (
                  <li key={w.id} className="flex justify-between">
                    <span>{new Date(w.created_at).toLocaleDateString()}</span>
                    <span>{w.amount} pts</span>
                    <span
                      className={
                        w.status === "pending"
                          ? "text-yellow-600"
                          : w.status === "approved"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {w.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
