"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Castle, ShoppingCart, Wallet, Clock, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/app/actions/auth"

export function CustomerDashboard() {
  const [userData, setUserData] = useState({
    points: 0,
    castles: 0,
    activeOrders: 0,
    completedOrders: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)

        const user = await getCurrentUser()
        if (!user) return

        // Fetch user stats
        const statsData = await query(
          `
          SELECT 
            u.points,
            (SELECT COUNT(*) FROM castles WHERE user_id = $1) as castles,
            (SELECT COUNT(*) FROM orders WHERE customer_id = $1 AND status IN ('pending', 'accepted')) as active_orders,
            (SELECT COUNT(*) FROM orders WHERE customer_id = $1 AND status = 'completed') as completed_orders
          FROM users u
          WHERE u.id = $1
        `,
          [user.id],
        )

        if (statsData.length > 0) {
          setUserData({
            points: Number.parseInt(statsData[0].points) || 0,
            castles: Number.parseInt(statsData[0].castles) || 0,
            activeOrders: Number.parseInt(statsData[0].active_orders) || 0,
            completedOrders: Number.parseInt(statsData[0].completed_orders) || 0,
          })
        }

        // Fetch featured products
        const productsData = await query(`
          SELECT id, name, description, price, image_url
          FROM products
          WHERE active = true
          ORDER BY id
          LIMIT 3
        `)

        setFeaturedProducts(productsData)

        // Fetch recent orders
        const ordersData = await query(
          `
          SELECT o.id, o.status, o.created_at, p.name as product_name, c.name as castle_name
          FROM orders o
          JOIN products p ON o.product_id = p.id
          JOIN castles c ON o.castle_id = c.id
          WHERE o.customer_id = $1
          ORDER BY o.created_at DESC
          LIMIT 3
        `,
          [user.id],
        )

        setRecentOrders(ordersData)
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
      <h1 className="text-2xl font-bold tracking-tight">Customer Dashboard</h1>

      {/* Wallet Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            My Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm opacity-90">Available Balance</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : `${userData.points} Points`}</p>
            </div>
            <Button variant="secondary" className="w-full md:w-auto" asChild>
              <a href="/customer/wallet">Top Up Points</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Castles</CardTitle>
            <Castle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : userData.castles}</div>
            <Button variant="link" className="px-0" asChild>
              <a href="/customer/castles">Manage Castles</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : userData.activeOrders}</div>
            <Button variant="link" className="px-0" asChild>
              <a href="/customer/orders">View Orders</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : userData.completedOrders}</div>
            <Button variant="link" className="px-0" asChild>
              <a href="/customer/orders">Order History</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Featured Products */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">Loading products...</div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-video w-full bg-muted">
                    <img
                      src={product.image_url || "/placeholder.svg?height=100&width=100"}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description || "No description"}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-medium">{product.price} points</p>
                      <Button size="sm" asChild>
                        <a href="/customer/shop">Buy Now</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">No products available</div>
          )}

          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <a href="/customer/shop">View All Products</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
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
                      {order.product_name} for {order.castle_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ordered on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/customer/orders/${order.id}`}>View Details</a>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">No orders yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
