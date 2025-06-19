"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { getOrdersByUserId, completeOrder, acceptOrder } from "@/app/actions/orders"
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
    account?: string
    password?: string
    login_credentials?: string
  }
}

export default function SellerOrdersPage() {
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
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [toast])

  const handleCompleteOrder = async (orderId: number) => {
    if (confirm("Are you sure you want to mark this order as completed?")) {
      try {
        const result = await completeOrder(orderId)
        if (result.success) {
          toast({ title: "Success", description: "Order marked as completed" })
          setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o)))
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to complete order",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      }
    }
  }

  const handleAcceptOrder = async (orderId: number) => {
    try {
      const result = await acceptOrder(orderId)
      if (result.success) {
        toast({ title: "Order accepted" })
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: "accepted" } : o)))
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to accept order",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const activeOrders = orders.filter((o) => o.status === "accepted")
  const completedOrders = orders.filter((o) => o.status === "completed")
  const cancelledOrders = orders.filter((o) => ["cancelled", "disputed"].includes(o.status))
  const pendingOrders = orders.filter((o) => o.status === "pending")

  const calculateStats = () => {
    const totalOrders = orders.length
    const completedCount = completedOrders.length
    const totalPoints = completedOrders.reduce((sum, o) => sum + o.amount, 0)
    return { totalOrders, completedCount, totalPoints }
  }

  const { totalOrders, completedCount, totalPoints } = calculateStats()

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
    <DashboardLayout userRole="seller">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{completedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Points Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{totalPoints} points</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {/* Active Orders */}
          <TabsContent value="active">
            {isLoading ? (
              <p className="text-center py-12 text-gray-500">Loading...</p>
            ) : activeOrders.length ? (
              <OrderList
                orders={activeOrders}
                getStatusBadge={getStatusBadge}
                onComplete={handleCompleteOrder}
              />
            ) : (
              <EmptyState message="No active orders" />
            )}
          </TabsContent>

          {/* Pending Orders */}
          <TabsContent value="pending">
            {isLoading ? (
              <p className="text-center py-12 text-gray-500">Loading...</p>
            ) : pendingOrders.length ? (
              <OrderList
                orders={pendingOrders}
                getStatusBadge={getStatusBadge}
                onAccept={handleAcceptOrder}
              />
            ) : (
              <EmptyState message="No pending orders" />
            )}
          </TabsContent>

          {/* Completed Orders */}
          <TabsContent value="completed">
            {isLoading ? (
              <p className="text-center py-12 text-gray-500">Loading...</p>
            ) : completedOrders.length ? (
              <OrderList orders={completedOrders} getStatusBadge={getStatusBadge} />
            ) : (
              <EmptyState message="No completed orders" />
            )}
          </TabsContent>

          {/* Cancelled/Disputed Orders */}
          <TabsContent value="cancelled">
            {isLoading ? (
              <p className="text-center py-12 text-gray-500">Loading...</p>
            ) : cancelledOrders.length ? (
              <OrderList orders={cancelledOrders} getStatusBadge={getStatusBadge} />
            ) : (
              <EmptyState message="No cancelled or disputed orders" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function OrderList({
  orders,
  getStatusBadge,
  onComplete,
  onAccept,
}: {
  orders: Order[]
  getStatusBadge: (status: string) => React.ReactNode
  onComplete?: (id: number) => void
  onAccept?: (id: number) => void
}) {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
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
                {order.castle.account && (
                  <p><span className="font-medium">Account:</span> {order.castle.account}</p>
                )}
                {order.castle.password && (
                  <p><span className="font-medium">Password:</span> {order.castle.password}</p>
                )}
                <p><span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleDateString()}</p>
                {order.castle.login_credentials && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md border">
                    <p className="font-medium text-sm">Login Credentials:</p>
                    <p className="text-sm whitespace-pre-wrap">{order.castle.login_credentials}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end">
                <p className="font-medium text-lg text-green-600">{order.amount} points</p>
                {onComplete && (
                  <Button size="sm" className="mt-2" onClick={() => onComplete(order.id)}>
                    Mark as Completed
                  </Button>
                )}
                {onAccept && (
                  <Button size="sm" className="mt-2" onClick={() => onAccept(order.id)}>
                    Accept Order
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">{message}</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/seller/available-orders">Browse Available Orders</Link>
      </Button>
    </div>
  )
}
