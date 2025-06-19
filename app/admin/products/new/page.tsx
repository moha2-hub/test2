"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProduct } from "@/app/actions/products"
import { getOffersByProduct } from "@/app/actions/products-new"

const categories = ["bots", "resources", "recharge", "events", "sira"]

export default function AddProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    image: null as File | null,
  })

  const [loading, setLoading] = useState(false)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    quantity: "",
    price: ""
  });
  const [offers, setOffers] = useState<any[]>([]);
  const [offerError, setOfferError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm({ ...form, image: e.target.files[0] })
    }
  }

  const fetchOffers = async (productId: string) => {
    try {
      const offers = await getOffersByProduct(Number(productId));
      setOffers(offers);
    } catch (err) {
      setOfferError("Failed to fetch offers.");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.image) {
      alert("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("productType", form.category);
      formData.append("image", form.image);
      const result = await createProduct(formData);
      console.log("Product creation result:", result);
      if (result?.success && result.productId) {
        setCreatedProductId(result.productId.toString());
        alert("Product created! Now add offers below.");
        fetchOffers(result.productId.toString());
      } else {
        alert(result?.message || "Failed to create product.");
      }
    } catch (error) {
      alert("An unexpected error occurred.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError("");
    if (!createdProductId || !offerForm.title || !offerForm.description || !offerForm.quantity || !offerForm.price) {
      setOfferError("Please fill all offer fields.");
      return;
    }
    const formData = new FormData();
    formData.append("productId", createdProductId);
    formData.append("title", offerForm.title);
    formData.append("description", offerForm.description);
    formData.append("quantity", offerForm.quantity);
    formData.append("price", offerForm.price);
    const result = await import("@/app/actions/products-new").then(m => m.createOffer(formData));
    console.log("Offer creation result:", result);
    if (result?.success) {
      setOfferForm({ title: "", description: "", quantity: "", price: "" });
      fetchOffers(createdProductId);
      alert("Offer added!");
    } else {
      setOfferError(result?.message || "Failed to add offer.");
    }
  };

  return (
    <DashboardLayout userRole="admin">
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6 mt-6">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="price">Price (in points)</Label>
          <Input name="price" value={form.price} onChange={handleChange} type="number" required />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            onValueChange={(val) => setForm({ ...form, category: val })}
            value={form.category}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="image">Product Image</Label>
          <Input type="file" accept="image/*" onChange={handleFileChange} required />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </Button>
      </form>

      {createdProductId && (
        <div className="max-w-xl mx-auto space-y-6 mt-10 border-t pt-6">
          <h2 className="text-lg font-bold">Add Offers for this Product</h2>
          <form onSubmit={handleOfferSubmit} className="space-y-4">
            <div>
              <Label htmlFor="offerTitle">Offer Title</Label>
              <Input name="title" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="offerDescription">Description</Label>
              <Input name="description" value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="offerQuantity">Quantity</Label>
              <Input name="quantity" type="number" value={offerForm.quantity} onChange={e => setOfferForm({ ...offerForm, quantity: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="offerPrice">Price</Label>
              <Input name="price" type="number" value={offerForm.price} onChange={e => setOfferForm({ ...offerForm, price: e.target.value })} required />
            </div>
            {offerError && <div className="text-red-600 text-sm">{offerError}</div>}
            <Button type="button" onClick={handleOfferSubmit} disabled={!createdProductId}>
              Create Offer
            </Button>
          </form>
          {offers.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Current Offers</h3>
              <ul className="list-disc pl-5">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    {offer.title} - {offer.description} | Quantity: {offer.quantity} | Price: {offer.price}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
