"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Package, ShoppingCart, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { query } from "@/lib/db"
import { useTranslation } from "react-i18next"

export function AdminDashboard() {
  const { t } = useTranslation("common");
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    pendingOrders: 0,
    openReclamations: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)

        // Fetch stats
        const statsData = await query(`
          SELECT 
            (SELECT COUNT(*) FROM products) as products,
            (SELECT COUNT(*) FROM users) as users,
            (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
            (SELECT COUNT(*) FROM reclamations WHERE status = 'pending') as open_reclamations
        `)

        if (statsData.length > 0) {
          setStats({
            products: Number.parseInt(statsData[0].products) || 0,
            users: Number.parseInt(statsData[0].users) || 0,
            pendingOrders: Number.parseInt(statsData[0].pending_orders) || 0,
            openReclamations: Number.parseInt(statsData[0].open_reclamations) || 0,
          })
        }

        // Fetch recent activity
        const activityData = await query(`
          SELECT 
            'transaction' as type,
            id,
            user_id,
            created_at,
            type as transaction_type,
            amount
          FROM transactions
          WHERE status = 'pending' AND type = 'top_up'
          
          UNION ALL
          
          SELECT 
            'order' as type,
            id,
            customer_id as user_id,
            created_at,
            status,
            amount
          FROM orders
          WHERE created_at > NOW() - INTERVAL '24 hours'
          
          UNION ALL
          
          SELECT 
            'reclamation' as type,
            id,
            customer_id as user_id,
            created_at,
            status,
            NULL as amount
          FROM reclamations
          WHERE status = 'pending'
          
          ORDER BY created_at DESC
          LIMIT 5
        `)

        setRecentActivity(activityData)
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
      <h1 className="text-2xl font-bold tracking-tight">{t("adminDashboard")}</h1>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalProducts")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("pendingOrders")}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("openReclamations")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.openReclamations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">{t("loadingActivity")}</div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="mr-4 mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                    {item.type === "transaction" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : item.type === "order" ? (
                      <ShoppingCart className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {item.type === "transaction"
                        ? t("newPointTopUpRequest")
                        : item.type === "order"
                        ? t("newOrderPlaced")
                        : t("newReclamationFiled")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.type === "transaction"
                        ? t("userRequestedPoints", { userId: item.user_id, amount: item.amount })
                        : item.type === "order"
                        ? t("orderPlaced", { id: item.id })
                        : t("reclamationFiled", { id: item.id })}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">{t("noRecentActivity")}</div>
          )}
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pendingApprovals")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="top-ups">
            <TabsList className="mb-4">
              <TabsTrigger value="top-ups">{t("pointTopUps")}</TabsTrigger>
              <TabsTrigger value="reclamations">{t("reclamations")}</TabsTrigger>
              <TabsTrigger value="sellers">{t("sellerApplications")}</TabsTrigger>
            </TabsList>

            <TabsContent value="top-ups">
              <div className="py-6 text-center text-muted-foreground">
                {t("visitTopUpsPage")}
              </div>
            </TabsContent>

            <TabsContent value="reclamations">
              <div className="py-6 text-center text-muted-foreground">
                {t("visitReclamationsPage")}
              </div>
            </TabsContent>

            <TabsContent value="sellers">
              <div className="py-6 text-center text-muted-foreground">
                {t("visitUsersPage")}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Add these keys to your translation files:
// "adminDashboard": "Admin Dashboard",
// "totalProducts": "Total Products",
// "totalUsers": "Total Users",
// "pendingOrders": "Pending Orders",
// "openReclamations": "Open Reclamations",
// "recentActivity": "Recent Activity",
// "loadingActivity": "Loading activity...",
// "newPointTopUpRequest": "New point top-up request",
// "newOrderPlaced": "New order placed",
// "newReclamationFiled": "New reclamation filed",
// "userRequestedPoints": "User ID {{userId}} requested {{amount}} points",
// "orderPlaced": "Order #{{id}} was placed",
// "reclamationFiled": "Reclamation #{{id}} was filed",
// "noRecentActivity": "No recent activity",
// "pendingApprovals": "Pending Approvals",
// "pointTopUps": "Point Top-ups",
// "reclamations": "Reclamations",
// "sellerApplications": "Seller Applications",
// "visitTopUpsPage": "Visit the Top-ups page to manage pending top-up requests",
// "visitReclamationsPage": "Visit the Reclamations page to manage pending complaints",
// "visitUsersPage": "Visit the Users page to manage user roles"
