"use client"

import { useEffect, useState } from "react"
import { acceptOrder } from "@/app/actions/orders"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EyeOff, Shield } from "lucide-react"

type Order = {
  id: number
  amount: number
  quantity: number
  created_at: string
  product: {
    name: string
    price: number
  }
  castle: {
    name: string
    login_credentials?: string
  }
  customer: {
    username: string
  }
}

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailableOrders()
  }, [])

  async function fetchAvailableOrders() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/seller/available-orders")
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      if (data.success) {
        setOrders(data.orders || [])
      } else {
        throw new Error(data.error || "Failed to fetch orders")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError("Failed to load orders. Please try again.")
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(orderId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to accept this order? Castle login credentials will be revealed after acceptance.",
    )
    if (!confirmed) return

    try {
      const res = await acceptOrder(orderId)
      if (res.success) {
        toast.success("Order accepted! Castle credentials are now available in 'My Orders'.")
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
      } else {
        toast.error(res.message || "Failed to accept order")
      }
    } catch (error) {
      console.error("Accept error:", error)
      toast.error("Failed to accept order")
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Available Orders</h1>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Available Orders</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={fetchAvailableOrders} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Orders</h1>
        <Button onClick={fetchAvailableOrders} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Shield className="h-5 w-5" />
            <p className="text-sm">
              <strong>Security Notice:</strong> Castle login credentials are hidden until you accept an order. Once
              accepted, credentials will be available in your "My Orders" section.
            </p>
          </div>
        </CardContent>
      </Card>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>No available orders right now.</p>
              <p className="text-sm mt-2">Check back later for new orders.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold">Product:</p>
                    <p>{order.product.name}</p>
                    <p className="text-sm text-gray-600">Price: ${order.product.price}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Customer:</p>
                    <p>{order.customer.username}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Castle:</p>
                    <p>{order.castle.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <EyeOff className="h-4 w-4" />
                      <span>Login credentials hidden until accepted</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Order Details:</p>
                    <p>Quantity: {order.quantity}</p>
                    <p className="text-green-600 font-medium">Earn: {order.amount} points</p>
                    <p className="text-sm text-gray-600">Created: {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <Button onClick={() => handleAccept(order.id)} className="w-full">
                  Accept Order & Reveal Credentials
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
