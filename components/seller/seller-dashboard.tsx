"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/app/actions/auth"
import { ShoppingBag, CheckCircle, DollarSign, Clock } from "lucide-react"
import Link from "next/link"

// Add a type for orders
interface SellerOrder {
  id: number;
  status: string;
  amount: number;
  created_at: string;
  product: { name: string; price: number };
  castle: { name: string; login_credentials?: string; igg_id?: string };
  customer?: { username: string };
}

export function SellerDashboard() {
  const [stats, setStats] = useState({
    points: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalEarned: 0,
  })
  const [recentOrders, setRecentOrders] = useState<SellerOrder[]>([])
  const [availableOrders, setAvailableOrders] = useState<SellerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)
        const user = await getCurrentUser()

        if (!user) return

        // Fetch seller stats
        const statsData = await query(
          `
          SELECT 
            u.points,
            (SELECT COUNT(*) FROM orders WHERE seller_id = $1 AND status = 'accepted') as active_orders,
            (SELECT COUNT(*) FROM orders WHERE seller_id = $1 AND status = 'completed') as completed_orders,
            (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE seller_id = $1 AND status = 'completed') as total_earned
          FROM users u
          WHERE u.id = $1
        `,
          [user.id],
        )

        if (statsData.length > 0) {
          setStats({
            points: Number(statsData[0].points) || 0,
            activeOrders: Number(statsData[0].active_orders) || 0,
            completedOrders: Number(statsData[0].completed_orders) || 0,
            totalEarned: Number(statsData[0].total_earned) || 0,
          })
        }

        // Fetch recent orders assigned to this seller
        const ordersData = await query(
          `
          SELECT 
            o.id, o.status, o.amount, o.created_at,
            json_build_object('name', p.name, 'price', p.price) as product,
            json_build_object('name', c.name, 'login_credentials', c.login_credentials) as castle,
            json_build_object('username', cu.username) as customer
          FROM orders o
          JOIN products p ON o.product_id = p.id
          JOIN castles c ON o.castle_id = c.id
          JOIN users cu ON o.customer_id = cu.id
          WHERE o.seller_id = $1
          ORDER BY o.created_at DESC
          LIMIT 3
        `,
          [user.id],
        )

        setRecentOrders(ordersData)

        // Fetch available orders (pending orders with no seller assigned)
        const availableData = await query(
          `
          SELECT 
            o.id, o.status, o.amount, o.created_at,
            json_build_object('name', p.name, 'price', p.price) as product,
            json_build_object('name', c.name) as castle
          FROM orders o
          JOIN products p ON o.product_id = p.id
          JOIN castles c ON o.castle_id = c.id
          WHERE o.status = 'pending' AND o.seller_id IS NULL
          ORDER BY o.created_at DESC
          LIMIT 3
        `,
        )

        setAvailableOrders(availableData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Seller Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Points</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.points}</div>
            <Button variant="link" className="px-0" asChild>
              <Link href="/seller/wallet">Withdraw</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.activeOrders}</div>
            <Button variant="link" className="px-0" asChild>
              <Link href="/seller/my-orders">View Orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.completedOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{isLoading ? "..." : `${stats.totalEarned} points`}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>My Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">Loading orders...</div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">#{order.id}</p>
                      <div className="flex items-center gap-1">
                        {order.status === "completed" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-xs capitalize">{order.status}</span>
                      </div>
                    </div>
                    <p className="text-sm">
                      {order.product.name} for {order.castle.name}
                      {order.castle.igg_id && (
                        <span className="ml-2 text-xs text-blue-600">IGG ID: {order.castle.igg_id}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{order.amount} points</p>
                    <Button size="sm" variant="outline" asChild className="mt-1">
                      <Link href={`/seller/my-orders`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">No orders yet</div>
          )}

          {recentOrders.length > 0 && (
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link href="/seller/my-orders">View All Orders</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Available Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">Loading available orders...</div>
          ) : availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">#{order.id}</p>
                    <p className="text-sm">
                      {order.product.name} for {order.castle.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{order.amount} points</p>
                    <Button size="sm" className="mt-1" asChild>
                      <Link href="/seller/available-orders">Accept</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">No available orders</div>
          )}

          {availableOrders.length > 0 && (
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link href="/seller/available-orders">View All Available Orders</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
