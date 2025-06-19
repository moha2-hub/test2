import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { DashboardLayout } from "@/components/custom-dashboard-layout"

export default function AdminPage() {
  return (
    <DashboardLayout userRole="admin">
      <AdminDashboard />
    </DashboardLayout>
  )
}
