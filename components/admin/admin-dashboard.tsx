"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Package, ShoppingCart, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { query } from "@/lib/db"
import { getFailedAttempts } from "@/lib/login-attempts"
import { useTranslation } from "react-i18next"

  const { t } = useTranslation("common");
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    pendingOrders: 0,
    openReclamations: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [failedAttempts, setFailedAttempts] = useState<{ email: string; count: number; lockUntil: number }[]>([])

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

        // Get failed login attempts
        setFailedAttempts(getFailedAttempts())
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
    // Optionally poll every 10s
    const interval = setInterval(() => setFailedAttempts(getFailedAttempts()), 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("adminDashboard")}</h1>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ...existing code... */}
      </div>

      {/* Failed Login Attempts */}
      {failedAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{t("failedLoginAttempts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedAttempts.map((a) => (
                <div key={a.email} className="flex flex-col border p-2 rounded bg-red-50">
                  <span className="font-semibold">{a.email}</span>
                  <span>{t("failedAttemptsCount", { count: a.count })}</span>
                  <span>{t("lockedUntil", { seconds: Math.max(0, Math.ceil((a.lockUntil - Date.now()) / 1000)) })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {/* ...existing code... */}

      {/* Pending Approvals */}
      {/* ...existing code... */}
    </div>
  )
}

// Add these keys to your translation files:
// "failedLoginAttempts": "Failed Login Attempts",
// "failedAttemptsCount": "Failed attempts: {{count}}",
// "lockedUntil": "Locked for {{seconds}} seconds",
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
