"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProductById, updateProduct, createOffer, getOffersByProduct, deleteOffer } from "@/app/actions/products"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { useTranslation } from "react-i18next"

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  active: boolean;
  category: string;
  type: string;
};

type Offer = {
  id: number;
  product_id: number;
  title: string;
  description: string;
  quantity: number;
  price: number;
};

export default function EditProductPage() {
  const { t } = useTranslation("common");
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [offers, setOffers] = useState<Offer[]>([])
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    quantity: "",
    price: ""
  })
  const [offerError, setOfferError] = useState("")
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [editOfferForm, setEditOfferForm] = useState({
    title: "",
    description: "",
    quantity: "",
    price: ""
  })
  const [editOfferError, setEditOfferError] = useState("")

  // Fix: convert id to number for getProductById
  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      const data = await getProductById(Number(id));
      setProduct(data);
    }
    loadProduct();
  }, [id])

  useEffect(() => {
    if (product?.id) {
      getOffersByProduct(product.id).then(setOffers)
    }
  }, [product?.id])

  // Fix: updateProduct expects a single FormData argument
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!product) return;
      const formData = new FormData();
      formData.append("id", product.id.toString());
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("price", product.price.toString());
      formData.append("imageUrl", product.image_url || "");
      formData.append("active", product.active.toString());
      formData.append("category", product.category);
      formData.append("type", product.type);
      await updateProduct(formData);
      router.push("/admin/products");
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddOffer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOfferError("");
    if (!product || !offerForm.title || !offerForm.description || !offerForm.quantity || !offerForm.price) {
      setOfferError("Please fill all offer fields.");
      return;
    }
    const formData = new FormData();
    formData.append("productId", product.id.toString());
    formData.append("title", offerForm.title);
    formData.append("description", offerForm.description);
    formData.append("quantity", offerForm.quantity);
    formData.append("price", offerForm.price);
    const result = await createOffer(formData);
    if (result?.success) {
      setOfferForm({ title: "", description: "", quantity: "", price: "" });
      getOffersByProduct(product.id).then(setOffers);
    } else {
      setOfferError(result?.message || "Failed to add offer.");
    }
  }

  async function handleEditOfferSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditOfferError("");
    if (!editingOffer || !editOfferForm.title || !editOfferForm.description || !editOfferForm.quantity || !editOfferForm.price) {
      setEditOfferError("Please fill all offer fields.");
      return;
    }
    const formData = new FormData();
    formData.append("id", editingOffer.id.toString());
    formData.append("title", editOfferForm.title);
    formData.append("description", editOfferForm.description);
    formData.append("quantity", editOfferForm.quantity);
    formData.append("price", editOfferForm.price);
    const result = await import("@/app/actions/products-new").then(m => m.updateOffer(formData));
    if (result?.success && product) {
      setEditingOffer(null);
      getOffersByProduct(product.id).then(setOffers);
    } else {
      setEditOfferError(result?.message || "Failed to update offer.");
    }
  }

  if (!product) return <div className="p-6">Loading...</div>

  return (
    <DashboardLayout userRole="admin">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold">{t("editProduct")}</h1>

        <div>
          <Label>{t("name")}</Label>
          <Input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
        </div>

        <div>
          <Label>{t("price")}</Label>
          <Input
            type="number"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label>{t("category")}</Label>
          <Input value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} />
        </div>

        <div className="flex items-center justify-between">
          <Label>{t("active")}</Label>
          <Switch
            checked={product.active}
            onCheckedChange={(val) => setProduct({ ...product, active: val })}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("updating") : t("updateProduct")}
        </Button>
      </form>

      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-bold mb-2">{t("createOfferFor", { name: product.name })}</h2>
        <form onSubmit={handleAddOffer} className="space-y-2">
          <div>
            <Label>{t("title")}</Label>
            <Input value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} />
          </div>
          <div>
            <Label>{t("description")}</Label>
            <Input value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} />
          </div>
          <div>
            <Label>{t("quantity")}</Label>
            <Input type="number" value={offerForm.quantity} onChange={e => setOfferForm({ ...offerForm, quantity: e.target.value })} />
          </div>
          <div>
            <Label>{t("totalPrice")}</Label>
            <Input type="number" value={offerForm.price} onChange={e => setOfferForm({ ...offerForm, price: e.target.value })} />
          </div>
          {offerError && <div className="text-red-600 text-sm">{offerError}</div>}
          <Button type="submit">{t("createOffer")}</Button>
        </form>
        {offers.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">{t("currentOffers")}</h3>
            <ul className="list-disc pl-5">
              {offers.map((offer, idx) => (
                <li key={offer.id} className="flex items-center gap-2">
                  {editingOffer && editingOffer.id === offer.id ? (
                    <form onSubmit={handleEditOfferSubmit} className="flex gap-2 items-center">
                      <Input value={editOfferForm.title} onChange={e => setEditOfferForm({ ...editOfferForm, title: e.target.value })} className="w-24" />
                      <Input value={editOfferForm.description} onChange={e => setEditOfferForm({ ...editOfferForm, description: e.target.value })} className="w-32" />
                      <Input type="number" value={editOfferForm.quantity} onChange={e => setEditOfferForm({ ...editOfferForm, quantity: e.target.value })} className="w-16" />
                      <Input type="number" value={editOfferForm.price} onChange={e => setEditOfferForm({ ...editOfferForm, price: e.target.value })} className="w-16" />
                      <Button type="submit" size="sm">{t("save")}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditingOffer(null)}>{t("cancel")}</Button>
                      {editOfferError && <span className="text-red-600 text-xs">{editOfferError}</span>}
                    </form>
                  ) : (
                    <>
                      {offer.title} - {offer.description} | {t("quantity")}: {offer.quantity} | {t("totalPrice")}: {offer.price}
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingOffer(offer);
                        setEditOfferForm({
                          title: offer.title,
                          description: offer.description,
                          quantity: offer.quantity.toString(),
                          price: offer.price.toString(),
                        });
                      }}>{t("edit")}</Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        await deleteOffer(offer.id);
                        if (product) {
                          getOffersByProduct(product.id).then(setOffers);
                        }
                      }}>{t("delete")}</Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add this comment to indicate translation keys used on this page
      Add these keys to your translation files (en/common.json and ar/common.json):
      "editProduct": "Edit Product",
      "name": "Name",
      "price": "Price",
      "category": "Category",
      "active": "Active",
      "updating": "Updating...",
      "updateProduct": "Update Product",
      "createOfferFor": "Create Offer for {{name}}",
      "title": "Title",
      "description": "Description",
      "quantity": "Quantity",
      "totalPrice": "Total Price",
      "createOffer": "Create Offer",
      "currentOffers": "Current Offers",
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete"
      */}
    </DashboardLayout>
  )
}
