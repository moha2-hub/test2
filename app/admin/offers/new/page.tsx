"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createOffer } from "@/app/actions/products-new"

export default function AddOfferPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    productId: "",
    title: "",
    description: "",
    quantity: "",
    price: ""
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId || !form.title || !form.description || !form.quantity || !form.price) {
      alert("Please fill all fields.")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("productId", form.productId)
      formData.append("title", form.title)
      formData.append("description", form.description)
      formData.append("quantity", form.quantity)
      formData.append("price", form.price)
      const result = await createOffer(formData)
      if (result?.success) {
        router.push("/admin/offers")
      } else {
        alert("Failed to create offer.")
      }
    } catch (error) {
      alert("An unexpected error occurred.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="admin">
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6 mt-6">
        <div>
          <Label htmlFor="productId">Product ID</Label>
          <Input name="productId" value={form.productId} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="title">Offer Title</Label>
          <Input name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input name="description" value={form.description} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input name="quantity" value={form.quantity} onChange={handleChange} type="number" required />
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input name="price" value={form.price} onChange={handleChange} type="number" required />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Offer"}
        </Button>
      </form>
    </DashboardLayout>
  )
}
