"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { getTransactionsByUserId, requestTopUp } from "@/app/actions/transactions"
import { getCurrentUser } from "@/app/actions/auth"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Transaction = {
  id: number
  type: "top_up" | "payment" | "refund" | "payout"
  amount: number
  status: "pending" | "completed" | "rejected"
  payment_method: string | null
  receipt_url: string | null
  notes: string | null
  created_at: string
}

type User = {
  id: number
  username: string
  email: string
  points: number
  reserved_points: number
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [amount, setAmount] = useState("100")
  const [paymentMethod, setPaymentMethod] = useState("baridi_mob")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [paymentInfo, setPaymentInfo] = useState("RIP: 00799999004040539668")
  const { toast } = useToast()

  // Add preset top-up amounts
  const presetAmounts = ["10", "50", "100", "200", "500", "1000"]

  // Define currency prices for each method and amount
  const methodPrices: { [key: string]: { [amount: string]: string } } = {
    baridi_mob: {
      "10": "2500 DZD",
      "50": "12500 DZD",
      "100": "25000 DZD",
      "200": "50000 DZD",
      "500": "125000 DZD",
      "1000": "250000 DZD",
    },
    binance: {
      "10": "10 USDT",
      "50": "50 USDT",
      "100": "100 USDT",
      "200": "200 USDT",
      "500": "500 USDT",
      "1000": "1000 USDT",
    },
    vodafone_cash: {
      "10": "510 EGP",
      "50": "2550 EGP",
      "100": "5100 EGP",
      "200": "10200 EGP",
      "500": "25500 EGP",
      "1000": "51000 EGP",
    },
  }

  useEffect(() => {
    async function loadWalletData() {
      try {
        setIsLoading(true)
        const [txs, usr] = await Promise.all([
          getTransactionsByUserId(),
          getCurrentUser()
        ])
        setTransactions(txs)
        setUser(usr)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to load wallet data.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadWalletData()
  }, [toast])

  async function handleTopUpRequest() {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("amount", amount)
      formData.append("paymentMethod", paymentMethod)
      if (receiptFile) formData.append("receipt", receiptFile)
      formData.append("notes", notes)

      const result = await requestTopUp(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Top-up request submitted.",
        })
        const updatedTxs = await getTransactionsByUserId()
        setTransactions(updatedTxs)
        setIsDialogOpen(false)
        setAmount("100")
        setPaymentMethod("paypal")
        setReceiptFile(null)
        setNotes("")
        setPaymentInfo("RIP: 00799999004040539668")
      } else {
        toast({
          title: "Error",
          description: result.message || "Top-up failed.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Top-up request error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-600 border-yellow-400 flex items-center gap-1">
            Pending <span className="text-yellow-600">?</span>
          </Badge>
        )
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTransactionTypeBadge = (type: string) => {
    const iconClass = "h-3 w-3"
    switch (type) {
      case "top_up":
        return <div className="flex items-center gap-1"><ArrowUpRight className={`${iconClass} text-green-500`} /><span>Top-up</span></div>
      case "payment":
        return <div className="flex items-center gap-1"><ArrowDownLeft className={`${iconClass} text-red-500`} /><span>Payment</span></div>
      case "refund":
        return <div className="flex items-center gap-1"><RefreshCw className={`${iconClass} text-blue-500`} /><span>Refund</span></div>
      case "payout":
        return <div className="flex items-center gap-1"><CreditCard className={`${iconClass} text-purple-500`} /><span>Payout</span></div>
      default:
        return <span>{type}</span>
    }
  }

  // Show all payments/refunds that are completed, and ALL top_up (pending or completed)
  const paidRefundedAndTopup = transactions.filter(
    (tx) =>
      (tx.type === "payment" && tx.status === "completed") ||
      (tx.type === "refund" && tx.status === "completed") ||
      (tx.type === "top_up")
  )

  return (
    <DashboardLayout userRole="customer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Wallet</h1>

        {/* Wallet Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Balance</CardTitle>
            {user && <CardDescription>Account: <span className="font-semibold">{user.username}</span></CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div>
                <p className="text-sm opacity-90">Available Balance</p>
                <p className="text-3xl font-bold">{isLoading ? "..." : `${user?.points ?? 0} Points`}</p>
                {user?.reserved_points > 0 && (
                  <p className="text-sm opacity-75">{user.reserved_points} points reserved for pending orders</p>
                )}
              </div>

              {/* Top-up Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">Top Up Points</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Top-up</DialogTitle>
                    <DialogDescription>
                      Upload a receipt and choose a payment method. Points will be added after verification.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="presetAmount">Choose Amount</Label>
                      <Select
                        value={amount}
                        onValueChange={setAmount}
                      >
                        <SelectTrigger><SelectValue placeholder="Select amount" /></SelectTrigger>
                        <SelectContent>
                          {presetAmounts.map((amt) => (
                            <SelectItem key={amt} value={amt}>{amt} Points</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(value) => {
                          setPaymentMethod(value)
                          if (value === "baridi_mob")
                            setPaymentInfo("RIP: 00799999004040539668")
                          else if (value === "binance")
                            setPaymentInfo("Binance ID: 586376817")
                          else if (value === "vodafone_cash")
                            setPaymentInfo("Vodafone Cash: 01561628")
                          else
                            setPaymentInfo("")
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baridi_mob">Baridi Mob</SelectItem>
                          <SelectItem value="binance">Binance</SelectItem>
                          <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                        </SelectContent>
                      </Select>
                      {paymentInfo && <p className="text-sm text-muted-foreground">Send to: {paymentInfo}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receipt">Receipt</Label>
                      <Input id="receipt" type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                      <p className="text-xs text-muted-foreground">Upload your payment receipt</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details" />
                    </div>

                    {/* Show the currency price for the selected method and amount */}
                    {paymentMethod && amount && (
                      <p className="text-sm text-blue-600 font-semibold">
                        Price: {methodPrices[paymentMethod]?.[amount] || '-'} for {amount} Points
                      </p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleTopUpRequest} disabled={isLoading || !amount || !receiptFile}>
                      {isLoading ? "Submitting..." : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent point transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground">Loading...</div>
            ) : paidRefundedAndTopup.length > 0 ? (
              <div className="space-y-4">
                {paidRefundedAndTopup.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-start border-b pb-4 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{tx.id}</span>
                        {getTransactionTypeBadge(tx.type)}
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                      {tx.payment_method && (
                        <p className="text-xs text-muted-foreground">
                          Via {tx.payment_method.replace("_", " ")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={
                        tx.type === "payment"
                          ? "text-red-600"
                          : tx.status === "pending"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }>
                        {tx.status === "pending"
                          ? "?"
                          : tx.type === "payment"
                            ? "-"
                            : "+"}
                        {tx.amount} points
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No paid, refund, or top-up transactions yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  Make Your First Top-up
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
