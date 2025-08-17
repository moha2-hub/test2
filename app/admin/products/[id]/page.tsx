"use client"

import { useState, useEffect } from "react"
import { getProductById, updateProduct } from "@/app/actions/products"
import { getOffersByProduct, createOffer, deleteOffer } from "@/app/actions/offer"
import { useRouter, useParams } from "next/navigation"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = Number(params.id)

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [offers, setOffers] = useState<any[]>([])

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    unit: "",
    type: "",
  })

  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    quantity: "",
    price: "",
  })

  // Load product + offers
  useEffect(() => {
    async function fetchData() {
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

        const offerData = await getOffersByProduct(productId)
        setOffers(offerData || [])
      } catch (err) {
        setError("Failed to load product or offers")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [productId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setOfferForm((prev) => ({ ...prev, [name]: value }))
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

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createOffer({
        productId,
        ...offerForm,
        quantity: Number(offerForm.quantity),
        price: Number(offerForm.price),
      })
      if (result?.success) {
        const newOffers = await getOffersByProduct(productId)
        setOffers(newOffers)
        setOfferForm({ title: "", description: "", quantity: "", price: "" })
      } else {
        alert(result?.message || "Failed to create offer")
      }
    } catch {
      alert("Error creating offer")
    }
  }

  const handleDeleteOffer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this offer?")) return
    try {
      const result = await deleteOffer(id)
      if (result?.success) {
        setOffers((prev) => prev.filter((o) => o.id !== id))
      } else {
        alert(result?.message || "Failed to delete offer")
      }
    } catch {
      alert("Error deleting offer")
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-10">
      {/* Product edit form */}
      <div>
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

      {/* Offers management */}
      <div>
        <h2 className="text-xl font-bold mb-4">Offers</h2>

        <ul className="space-y-2 mb-6">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <div>
                <p className="font-semibold">{offer.title}</p>
                <p className="text-sm">{offer.description}</p>
                <p className="text-sm">Qty: {offer.quantity} | Price: {offer.price}</p>
              </div>
              <button
                onClick={() => handleDeleteOffer(offer.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleCreateOffer} className="space-y-2 border p-4 rounded">
          <h3 className="font-bold">Add New Offer</h3>
          <input
            type="text"
            name="title"
            placeholder="Offer Title"
            value={offerForm.title}
            onChange={handleOfferChange}
            className="w-full border p-2 rounded"
          />
          <textarea
            name="description"
            placeholder="Offer Description"
            value={offerForm.description}
            onChange={handleOfferChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={offerForm.quantity}
            onChange={handleOfferChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={offerForm.price}
            onChange={handleOfferChange}
            className="w-full border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Create Offer
          </button>
        </form>
      </div>
    </div>
  )
}
