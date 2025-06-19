"use client"
import Link from "next/link";
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { query } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"


type Order = {
  id: number
  customer_name: string
  seller_name: string | null
  product_name: string
  castle_name: string
  status: "pending" | "accepted" | "completed" | "cancelled" | "disputed"
  amount: number
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true)
        const ordersData = await query<Order>(`
          SELECT 
            o.id, 
            o.status, 
            o.amount, 
            o.created_at,
            c.username as customer_name,
            s.username as seller_name,
            p.name as product_name,
            ca.name as castle_name
          FROM orders o
          JOIN users c ON o.customer_id = c.id
          LEFT JOIN users s ON o.seller_id = s.id
          JOIN products p ON o.product_id = p.id
          JOIN castles ca ON o.castle_id = ca.id
          ORDER BY o.created_at DESC
        `)
        setOrders(ordersData)
      } catch (error) {
        console.error("Error loading orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

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
        <h1 className="text-2xl font-bold tracking-tight">Orders Management</h1>

        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground">Loading orders...</div>
            ) : orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Castle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{order.seller_name || "Not assigned"}</TableCell>
                      <TableCell>{order.product_name}</TableCell>
                      <TableCell>{order.castle_name}</TableCell>
                      <TableCell>{order.amount} points</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-muted-foreground">No orders found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
