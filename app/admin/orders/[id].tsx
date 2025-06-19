"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Order = {
  id: number
  customer_name: string
  seller_name: string | null
  product_name: string
  castle_name: string
  status: string
  amount: number
  created_at: string
}

export default function OrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/admin/orders/${id}`)
        const data = await res.json()
        setOrder(data)
      } catch (error) {
        console.error("Error fetching order:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchOrder()
  }, [id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "accepted":
        return <Badge variant="secondary">Accepted</Badge>
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "disputed":
        return <Badge className="bg-amber-500">Disputed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Order #{id} Details</h1>

        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : order ? (
          <Card>
            <CardHeader>
              <CardTitle>Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><strong>Customer:</strong> {order.customer_name}</div>
              <div><strong>Seller:</strong> {order.seller_name || "Not assigned"}</div>
              <div><strong>Product:</strong> {order.product_name}</div>
              <div><strong>Castle:</strong> {order.castle_name}</div>
              <div><strong>Amount:</strong> {order.amount} points</div>
              <div><strong>Status:</strong> {getStatusBadge(order.status)}</div>
              <div><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</div>
              <div className="pt-4">
                <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-destructive">Order not found</div>
        )}
      </div>
    </DashboardLayout>
  )
}
