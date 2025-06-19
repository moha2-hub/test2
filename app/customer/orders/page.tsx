"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { getOrdersByUserId, cancelOrder } from "@/app/actions/orders"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

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
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true)
        const ordersData = await getOrdersByUserId()
        setOrders(ordersData)
      } catch (error) {
        console.error("Error loading orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  const handleCancelOrder = async (orderId: number) => {
    try {
      const result = await cancelOrder(orderId)
      if (result.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
        )
        toast({ title: "Order cancelled", description: "Your points have been refunded." })
      } else {
        toast({ title: "Cannot cancel order", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel order.", variant: "destructive" })
      console.error("Failed to cancel order:", error)
    }
  }

  const activeOrders = orders.filter((order) => ["pending", "accepted"].includes(order.status))
  const completedOrders = orders.filter((order) => order.status === "completed")
  const cancelledOrders = orders.filter((order) => ["cancelled", "disputed"].includes(order.status))

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

  const renderOrderCard = (order: Order, showCancel = false) => (
    <Card key={order.id}>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle>Order #{order.id}</CardTitle>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="space-y-1">
            <p><span className="font-medium">Product:</span> {order.product.name}</p>
            <p><span className="font-medium">Castle:</span> {order.castle.name}</p>
            <p><span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <p className="font-medium text-lg">{order.amount} points</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" asChild>
                <Link href={`/customer/orders/${order.id}`}>View</Link>
              </Button>
              {showCancel && order.status === "pending" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancelOrder(order.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout userRole="customer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="active">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.map((order) => renderOrderCard(order, true))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No active orders</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/customer/shop">Browse Products</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : completedOrders.length > 0 ? (
                <div className="space-y-4">
                  {completedOrders.map((order) => renderOrderCard(order))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No completed orders</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : cancelledOrders.length > 0 ? (
                <div className="space-y-4">
                  {cancelledOrders.map((order) => renderOrderCard(order))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No cancelled orders</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
