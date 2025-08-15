"use client"

import { useState, useEffect } from "react"
import { getProductById, updateProduct } from "@/app/actions/products"
import { useRouter, useParams } from "next/navigation"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = Number(params.id)

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    unit: "",
    type: "",
  })

  useEffect(() => {
    async function fetchProduct() {
      try {
        const productData = await getProductById(productId)
        if (!productData) {
          setError("Product not found")
          return
        }
        setProduct(productData)
        setForm({
          name: productData.name || "",
          description: productData.description || "",
          price: productData.price || "",
          category_id: productData.category_id || "",
          unit: productData.unit || "",
          type: productData.type || "",
        })
      } catch (err) {
        setError("Failed to load product")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const result = await updateProduct(productId, form)
      if (result?.success) {
        router.push("/admin/products")
      } else {
        setError(result?.message || "Failed to update product")
      }
    } catch {
      setError("An error occurred while updating")
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="category_id"
          placeholder="Category ID"
          value={form.category_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="unit"
          placeholder="Unit"
          value={form.unit}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="type"
          placeholder="Type"
          value={form.type}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update Product
        </button>
      </form>
    </div>
  )
}
