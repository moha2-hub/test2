"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { query } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Reclamation = {
  id: number
  order_id: number
  customer_name: string
  description: string
  status: "pending" | "resolved" | "rejected"
  created_at: string
}

export default function ReclamationsPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadReclamations() {
      try {
        setIsLoading(true)
        const reclamationsData = await query<Reclamation>(`
          SELECT 
            r.id, 
            r.order_id,
            r.description,
            r.status, 
            r.created_at,
            u.username as customer_name
          FROM reclamations r
          JOIN users u ON r.customer_id = u.id
          ORDER BY 
            CASE 
              WHEN r.status = 'pending' THEN 0
              WHEN r.status = 'resolved' THEN 1
              ELSE 2
            END,
            r.created_at DESC
        `)
        setReclamations(reclamationsData)
      } catch (error) {
        console.error("Error loading reclamations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReclamations()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500">Pending</Badge>
      case "resolved":
        return <Badge variant="default">Resolved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Reclamations Management</h1>

        <Card>
          <CardHeader>
            <CardTitle>All Reclamations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground">Loading reclamations...</div>
            ) : reclamations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reclamations.map((reclamation) => (
                    <TableRow key={reclamation.id}>
                      <TableCell className="font-medium">{reclamation.id}</TableCell>
                      <TableCell>{reclamation.order_id}</TableCell>
                      <TableCell>{reclamation.customer_name}</TableCell>
                      <TableCell className="max-w-xs truncate">{reclamation.description}</TableCell>
                      <TableCell>{getStatusBadge(reclamation.status)}</TableCell>
                      <TableCell>{new Date(reclamation.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/reclamations/${reclamation.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-muted-foreground">No reclamations found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
