"use client"

import { useEffect, useState } from "react"
import { query } from "@/lib/db"
import { verifyTopUp } from "@/app/actions/transactions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

type TopUpRequest = {
  id: number
  user_id: number
  amount: number
  payment_method: string
  receipt_base64: string | null
  receipt_mime: string | null
  receipt_filename: string | null
  notes: string
  created_at: string
  user: {
    username: string
    email: string
  }
}

export default function TopUpsPage() {
  const [topUps, setTopUps] = useState<TopUpRequest[]>([])
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadTopUps() {
      try {
        setIsLoading(true)
        const result = await query<TopUpRequest>(
          `SELECT t.*, json_build_object('username', u.username, 'email', u.email) as user
           FROM transactions t
           JOIN users u ON t.user_id = u.id
           WHERE t.type = 'top_up' AND t.status = 'pending'
           ORDER BY t.created_at DESC`,
        )
        setTopUps(result)
      } catch (error) {
        console.error("Error loading top-ups:", error)
        toast({
          title: "Error",
          description: "Failed to load top-up requests",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTopUps()
  }, [toast])

  async function handleVerify(approved: boolean) {
    if (!selectedTopUp) return

    setIsLoading(true)

    try {
      const result = await verifyTopUp(selectedTopUp.id, approved)

      if (result.success) {
        toast({
          title: "Success",
          description: `Top-up request ${approved ? "approved" : "rejected"} successfully`,
        })

        setTopUps(topUps.filter((t) => t.id !== selectedTopUp.id))
        setIsDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to process top-up request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Verify top-up error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Point Top-up Requests</h1>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading top-up requests...</p>
        </div>
      ) : topUps.length > 0 ? (
        <div className="space-y-4">
          {topUps.map((topUp) => (
            <Card key={topUp.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Request #{topUp.id}</CardTitle>
                    <CardDescription>
                      From {topUp.user.username} ({topUp.user.email})
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{topUp.amount} Points</p>
                    <p className="text-sm text-gray-500">{new Date(topUp.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p>{topUp.payment_method || "Not specified"}</p>

                    {topUp.notes && (
                      <>
                        <p className="text-sm font-medium mt-2">Notes</p>
                        <p>{topUp.notes}</p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 md:self-end">
                    <Dialog
                      open={isDialogOpen && selectedTopUp?.id === topUp.id}
                      onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) setSelectedTopUp(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedTopUp(topUp)}>
                          View Receipt
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Receipt Verification</DialogTitle>
                          <DialogDescription>Verify the receipt for top-up request #{topUp.id}</DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                            {topUp.receipt_base64 ? (
                              topUp.receipt_mime?.startsWith("image/") ? (
                                <img
                                  src={`data:${topUp.receipt_mime};base64,${topUp.receipt_base64}`}
                                  alt={topUp.receipt_filename || "Receipt"}
                                  className="w-full h-full object-contain"
                                />
                              ) : topUp.receipt_mime === "application/pdf" ? (
                                <iframe
                                  src={`data:application/pdf;base64,${topUp.receipt_base64}`}
                                  title={topUp.receipt_filename || "Receipt PDF"}
                                  className="w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                  <a
                                    href={`/api/admin/download-receipt?id=${topUp.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline px-4 py-2 border rounded"
                                  >
                                    Download Receipt
                                  </a>
                                  <p className="text-gray-500 text-xs">({topUp.receipt_filename || 'File'})</p>
                                </div>
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <p className="text-gray-500">No receipt uploaded or invalid format</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 space-y-2">
                            <p>
                              <span className="font-medium">User:</span> {topUp.user.username}
                            </p>
                            <p>
                              <span className="font-medium">Amount:</span> {topUp.amount} Points
                            </p>
                            <p>
                              <span className="font-medium">Payment Method:</span>{" "}
                              {topUp.payment_method || "Not specified"}
                            </p>
                            <p>
                              <span className="font-medium">Date:</span> {new Date(topUp.created_at).toLocaleString()}
                            </p>

                            {topUp.notes && (
                              <p>
                                <span className="font-medium">Notes:</span> {topUp.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="destructive" onClick={() => handleVerify(false)} disabled={isLoading}>
                            {isLoading ? "Processing..." : "Reject"}
                          </Button>
                          <Button onClick={() => handleVerify(true)} disabled={isLoading}>
                            {isLoading ? "Processing..." : "Approve"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedTopUp(topUp)
                        handleVerify(false)
                      }}
                      disabled={isLoading}
                    >
                      Reject
                    </Button>

                    <Button
                      onClick={() => {
                        setSelectedTopUp(topUp)
                        handleVerify(true)
                      }}
                      disabled={isLoading}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No pending top-up requests</p>
        </div>
      )}
    </div>
  )
}
