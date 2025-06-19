"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createOrder } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardLayout } from "@/components/custom-dashboard-layout"

export default function NewOrderPage() {
  const router = useRouter()
  const [productId, setProductId] = useState("")
  const [castleId, setCastleId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("productId", productId)
    formData.append("castleId", castleId)
    const res = await createOrder(formData)
    if (res.success) {
      router.push(`/customer/orders/${res.orderId}`)
    } else {
      alert(res.message)
    }
  }

  return (
    <DashboardLayout userRole="customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Product ID</Label>
          <Input value={productId} onChange={(e) => setProductId(e.target.value)} />
        </div>
        <div>
          <Label>Castle ID</Label>
          <Input value={castleId} onChange={(e) => setCastleId(e.target.value)} />
        </div>
        <Button type="submit">Create Order</Button>
      </form>
    </DashboardLayout>
  )
}
