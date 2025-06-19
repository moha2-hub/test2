import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { CustomerDashboard } from "@/components/customer/customer-dashboard"

export default function CustomerPage() {
  return (
    <DashboardLayout userRole="customer">
      <CustomerDashboard />
    </DashboardLayout>
  )
}
