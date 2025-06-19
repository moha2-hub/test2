import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { SellerDashboard } from "@/components/seller/seller-dashboard"

export default function SellerPage() {
  return (
    <DashboardLayout userRole="seller">
      <SellerDashboard />
    </DashboardLayout>
  )
}
