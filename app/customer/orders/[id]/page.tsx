"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getOrderById, cancelOrder } from "@/app/actions/orders"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

type Order = {
  id: number
  status: "pending" | "accepted" | "completed" | "cancelled" | "disputed"
  amount: number
  created_at: string
  product: {
    name: string
    price: number
  }
  castle: {
    name: string
    login_credentials?: string | null
  }
}

export default function OrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOrder() {
      try {
        setIsLoading(true)
        const orderData = await getOrderById(Number(id))
        setOrder(orderData)
      } catch (error) {
        console.error("Error loading order:", error)
        toast.error("Failed to load order")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) loadOrder()
  }, [id])

  const handleCancelOrder = async () => {
    if (!order) return
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?")
    if (!confirmCancel) return

    const result = await cancelOrder(order.id)
    if (result.success) {
      toast.success("Order cancelled successfully")
      setOrder({ ...order, status: "cancelled" })
    } else {
      toast.error(result.message || "Failed to cancel order")
    }
  }

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
    <DashboardLayout userRole="customer">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <Button variant="outline" asChild>
            <Link href="/customer/orders">Back to Orders</Link>
          </Button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : order ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle>Order #{order.id}</CardTitle>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <strong>Product:</strong> {order.product.name}
              </p>
              <p>
                <strong>Castle:</strong> {order.castle.name}
              </p>
              <p>
                <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Amount:</strong> {order.amount} points
              </p>
              <p>
                <strong>Price:</strong> {order.product.price} points
              </p>
              {order.castle.login_credentials && (
                <p>
                  <strong>Login Credentials:</strong> {order.castle.login_credentials}
                </p>
              )}
              {order.status === "pending" && (
                <Button variant="destructive" onClick={handleCancelOrder}>
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="text-red-500">Order not found</p>
        )}
      </div>
    </DashboardLayout>
  )
}
